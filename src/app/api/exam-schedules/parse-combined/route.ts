import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const text = formData.get("text") as string | null;

    if (!image && !text) {
      return NextResponse.json(
        {
          error: "이미지 또는 텍스트 중 하나는 제공되어야 합니다.",
        },
        { status: 400 }
      );
    }

    let extractedImageText = "";
    let imageSchedules: any[] = [];
    let textSchedules: any[] = [];

    // 1. 이미지가 있으면 OCR로 텍스트 추출 후 공식 시험일정 파싱
    if (image) {
      try {
        extractedImageText = await extractTextFromImage(image);
        imageSchedules = await parseOfficialSchedule(extractedImageText);
      } catch (error) {
        console.error("이미지 처리 오류:", error);
        // 이미지 실패는 치명적이지 않음 - 텍스트만으로도 처리 가능
      }
    }

    // 2. 텍스트가 있으면 내부 마감일정 파싱
    if (text && text.trim()) {
      try {
        textSchedules = await parseInternalDeadline(text);
      } catch (error) {
        console.error("텍스트 처리 오류:", error);
        // 텍스트 실패는 치명적이지 않음 - 이미지만으로도 처리 가능
      }
    }

    // 3. 결과 통합 및 관계 연결
    const combinedSchedules = combineSchedules(imageSchedules, textSchedules);

    return NextResponse.json({
      success: true,
      data: {
        extractedImageText,
        providedText: text,
        imageSchedules,
        textSchedules,
        combinedSchedules,
        summary: {
          totalSchedules: combinedSchedules.length,
          officialSchedules: imageSchedules.length,
          internalDeadlines: textSchedules.length,
        },
      },
    });
  } catch (error) {
    console.error("통합 파싱 오류:", error);
    return NextResponse.json(
      {
        error: "일정 파싱 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

async function extractTextFromImage(file: File): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API 키가 설정되지 않았습니다.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "이미지에 있는 모든 텍스트를 정확하게 추출해주세요. 표 형태의 데이터라면 구조를 유지하면서 추출해주세요. 시험 일정표나 공지사항이라면 날짜, 시간, 지역 정보를 놓치지 말고 추출해주세요.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류 (${response.status})`);
    }

    const result = await response.json();
    const extractedText = result.choices[0]?.message?.content;

    if (!extractedText) {
      throw new Error("이미지에서 텍스트를 찾을 수 없습니다.");
    }

    return extractedText;
  } catch (error) {
    console.error("OCR 처리 오류:", error);
    throw new Error(
      `이미지 텍스트 추출 실패: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}

async function parseOfficialSchedule(text: string): Promise<any[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API 키가 설정되지 않았습니다.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `다음은 생명보험협회 또는 회사 내부 공지에서 제공된 **보험 설계사 시험 일정 관련 텍스트 혹은 표 이미지 OCR 결과**입니다.
                      이 데이터를 분석하여 시험 일정 정보를 구조화된 JSON으로 변환하세요.

                      ---

                      ### 🧭 구분 기준

                      1. **공식 시험일정 (금융감독원/생명보험협회 발표)**
                        - 실제 시험 날짜와 지역별 일정이 포함된 내용
                        - "서울 1차 11월 10일", "부산 3차 11월 13일" 등으로 표시됨
                        - 정식 시험일이므로, 실제 시험일(exam_date)과 지역(locations)을 반드시 포함

                      2. **내부 신청마감 (회사 자체 일정)**
                        - 본사에서 정한 자체 마감일과 수험표 공지일
                        - 예: "1~4차 시험접수마감: 11월 4일(화) 오전 11시"
                        - 공식 기관과는 무관하며, 내부 시스템용 일정

                      ---

                      ### 📦 출력 형식 (반드시 아래 JSON 형식으로만 응답)

                      {
                        "schedules": [
                          {
                            "year": 2025,
                            "exam_type": "생보",              // 생명보험협회 시험
                            "session_number": 1,             // 차수 (예: 1차, 2차 등)
                            "registration_start_date": "2025-10-25", // 접수 시작일 (내부는 마감일 10일 전 추정)
                            "registration_end_date": "2025-11-04",   // 접수 마감일
                            "exam_date": "2025-11-10",               // 실제 시험일 (공식 일정 기준)
                            "exam_time_start": "10:00",
                            "exam_time_end": "12:00",
                            "locations": ["서울", "부산", "대구"],    // 시험 실시 지역
                            "notes": "공식 시험일정" or "본사 자체 신청 마감일"
                          }
                        ]
                      }

                      ---

                      ### 📐 처리 규칙

                      1. **공식 시험일정 처리**
                        - 표에 표시된 각 지역별 차수(1차~10차)의 시험일을 인식하여 \`exam_date\`로 변환
                        - 지역명은 해당 차수에 표시된 위치를 기반으로 배열로 정리
                        - 접수기간 정보가 없으면 registration_start_date, registration_end_date는 null로 둠
                        - notes에는 "공식 시험일정" 명시

                      2. **내부 신청마감 처리**
                        - "시험접수마감" 문구가 포함된 경우 registration_end_date로 인식
                        - registration_start_date는 마감일 10일 전으로 자동 추정
                        - exam_date는 내부 규칙상 마감일로부터 7~14일 후의 시험일로 추정
                        - notes에 "본사 자체 신청 마감일" 명시

                      3. **날짜 형식 변환**
                        - 반드시 "YYYY-MM-DD" 형식으로 변환
                        - 월/일 앞에 0을 붙임 (예: 11월 4일 → "2025-11-04")

                      4. **시간 기본값**
                        - 명시되지 않은 경우 10:00~12:00으로 설정

                      5. **시험 종류**
                        - 기본값: "생보" (생명보험협회 시험)
                        - 필요 시 "손보", "제3보험"으로 변경 가능

                      6. **지역 매핑 규칙 (중요!)**
                        이미지에서 나오는 지역 그룹을 정확한 지역명으로 변환해주세요:
                        - **수도권** → ["서울", "인천", "제주"]
                        - **영남** → ["부산", "울산"]
                        - **대구** → ["대구"]
                        - **호남** → ["광주", "전주"]
                        - **중부** → ["대전", "서산"]
                        - **원주** → ["원주", "강릉", "춘천"]

                        **주의사항**:
                        - "수도권", "영남" 등 그룹명을 그대로 사용하지 말고 반드시 구체적인 도시명으로 변환
                        - 위 목록에 없는 지역명이 나오면 가장 가까운 그룹에 매핑하거나 제외
                        - 예: "사천" → 제외, "서울(인천)" → ["서울", "인천"]

                      7. **예시**
                        - 입력 텍스트: "1~4차 시험접수마감: 11월 4일(화) 오전 11시"
                          → registration_end_date = "2025-11-04", registration_start_date = "2025-10-25", notes = "본사 자체 신청 마감일"

                        - 입력 텍스트: "수도권 1차 11월 10일, 영남 1차 11월 10일"
                          → exam_date = "2025-11-10", locations = ["서울", "인천", "제주", "부산", "울산"], notes = "공식 시험일정"

                      ---

                      ### ⚙️ 출력 규칙
                      - JSON 외의 텍스트, 주석, 설명 등을 절대 포함하지 말 것
                      - 배열 내 각 객체는 **차수별로 구분**
                      - 시험일정 이미지 또는 텍스트가 혼합된 경우, 각각의 유형을 구분해 병합

                      출력은 반드시 완전한 JSON이어야 합니다.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: { message: "알 수 없는 오류" } }));

      if (response.status === 401) {
        throw new Error("OpenAI API 키가 유효하지 않습니다.");
      } else if (response.status === 429) {
        if (errorData.error?.code === "insufficient_quota") {
          return generateDemoOfficialSchedule(text);
        } else {
          throw new Error(
            "API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요."
          );
        }
      } else {
        throw new Error(
          `OpenAI API 오류 (${response.status}): ${
            errorData.error?.message || "알 수 없는 오류"
          }`
        );
      }
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("AI에서 응답을 생성하지 못했습니다.");
    }

    let cleanResponse = aiResponse.trim();
    if (cleanResponse.startsWith("```json")) {
      cleanResponse = cleanResponse
        .replace(/```json\s*/, "")
        .replace(/\s*```$/, "");
    }
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse
        .replace(/```\s*/, "")
        .replace(/\s*```$/, "");
    }

    const parsedData = JSON.parse(cleanResponse);

    if (!parsedData.schedules || !Array.isArray(parsedData.schedules)) {
      throw new Error("유효한 일정 데이터가 생성되지 않았습니다.");
    }

    return parsedData.schedules;
  } catch (error) {
    console.error("공식 일정 파싱 오류:", error);

    if (error instanceof SyntaxError) {
      throw new Error("AI가 생성한 응답이 올바른 JSON 형식이 아닙니다.");
    }

    throw new Error(
      `공식 시험일정을 파싱할 수 없습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}

async function parseInternalDeadline(text: string): Promise<any[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API 키가 설정되지 않았습니다.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `다음은 생명보험협회 또는 회사 내부 공지에서 제공된 **보험 설계사 시험 일정 관련 텍스트**입니다.
                      이 데이터를 분석하여 내부 마감일정 정보를 구조화된 JSON으로 변환하세요.

                      ---

                      ### 🧭 구분 기준 - 내부 신청마감 (회사 자체 일정)

                      본사에서 정한 자체 마감일과 수험표 공지일
                      - 예: "1~4차 시험접수마감: 11월 4일(화) 오전 11시"
                      - 공식 기관과는 무관하며, 내부 시스템용 일정

                      ---

                      ### 📦 출력 형식 (반드시 아래 JSON 형식으로만 응답)

                      {
                      "schedules": [
                        {
                          "year": 2025,
                          "exam_type": "생보",              // 생명보험협회 시험
                          "session_range": "1~4차",        // 차수 범위
                          "session_numbers": [1, 2, 3, 4], // 해당 차수들
                          "internal_deadline_date": "2025-11-04", // 내부 마감일
                          "internal_deadline_time": "11:00",      // 마감시간
                          "notice_date": "2025-11-07",           // 수험표 공지일
                          "notice_time": "14:00",                // 공지시간
                          "locations": [],                       // 빈 배열 (내부 마감은 지역 무관)
                          "notes": "본사 자체 신청 마감일"
                        }
                      ]
                    }

                    ---

                    ### 📐 처리 규칙

                    1. **내부 신청마감 처리**:
                      - "시험접수마감" 문구가 포함된 경우 internal_deadline_date로 인식
                      - session_range는 "1~4차", "5~6차" 형태로 추출
                      - session_numbers는 해당 차수들을 배열로 [1,2,3,4]
                      - internal_deadline_time은 마감시간 (예: "오전 11시" → "11:00")
                      - notice_date는 수험표 공지일 (예: "11월 7일" → "2025-11-07")
                      - notice_time은 공지시간 (예: "오후 2시" → "14:00")
                      - notes에 "본사 자체 신청 마감일" 명시

                    2. **날짜 형식 변환**:
                      - 반드시 "YYYY-MM-DD" 형식으로 변환
                      - 월/일 앞에 0을 붙임 (예: 11월 4일 → "2025-11-04")

                    3. **시간 변환**:
                      - **시간 추출**: "오전 11시" → "11:00", "오후 2시" → "14:00" 등 정확히 변환
                      - 시간이 명시되지 않으면 10:00 기본값 사용
                      - 24시간 표기법으로 변환

                    4. **시험 종류**:
                      - 기본값: "생보" (생명보험협회 시험)
                      - 필요 시 "손보", "제3보험"으로 변경 가능

                    5. **지역 처리**:
                      - 내부 마감일정은 보통 지역 정보가 없으므로 빈 배열 [] 사용
                      - 텍스트에 지역이 명시된 경우만 포함

                    6. **예시**:
                      - 입력 텍스트: "1~4차 시험접수마감: 11월 4일(화) 오전 11시"
                        → session_range = "1~4차", session_numbers = [1,2,3,4], internal_deadline_date = "2025-11-04", internal_deadline_time = "11:00"

                    ---

                    ### ⚙️ 출력 규칙
                    - JSON 외의 텍스트, 주석, 설명 등을 절대 포함하지 말 것
                    - 배열 내 각 객체는 **마감일정별로 구분**

                    출력은 반드시 완전한 JSON이어야 합니다.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: { message: "알 수 없는 오류" } }));

      if (response.status === 401) {
        throw new Error("OpenAI API 키가 유효하지 않습니다.");
      } else if (response.status === 429) {
        if (errorData.error?.code === "insufficient_quota") {
          return generateDemoInternalDeadline(text);
        } else {
          throw new Error(
            "API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요."
          );
        }
      } else {
        throw new Error(
          `OpenAI API 오류 (${response.status}): ${
            errorData.error?.message || "알 수 없는 오류"
          }`
        );
      }
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("AI에서 응답을 생성하지 못했습니다.");
    }

    let cleanResponse = aiResponse.trim();
    if (cleanResponse.startsWith("```json")) {
      cleanResponse = cleanResponse
        .replace(/```json\s*/, "")
        .replace(/\s*```$/, "");
    }
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse
        .replace(/```\s*/, "")
        .replace(/\s*```$/, "");
    }

    const parsedData = JSON.parse(cleanResponse);

    if (!parsedData.schedules || !Array.isArray(parsedData.schedules)) {
      throw new Error("유효한 일정 데이터가 생성되지 않았습니다.");
    }

    return parsedData.schedules;
  } catch (error) {
    console.error("내부 마감일정 파싱 오류:", error);

    if (error instanceof SyntaxError) {
      throw new Error("AI가 생성한 응답이 올바른 JSON 형식이 아닙니다.");
    }

    throw new Error(
      `내부 마감일정을 파싱할 수 없습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}

function combineSchedules(imageSchedules: any[], textSchedules: any[]): any[] {
  const combinedSchedules: any[] = [];

  // 공식 시험일정을 기본으로 사용
  for (const imageSchedule of imageSchedules) {
    // 해당 시험 종류와 차수에 맞는 내부 마감일정 찾기
    const matchingTextSchedule = textSchedules.find(
      (textSched) =>
        textSched.exam_type === imageSchedule.exam_type &&
        textSched.session_numbers?.includes(imageSchedule.session_number)
    );

    combinedSchedules.push({
      // 공식 시험일정 정보
      ...imageSchedule,
      // 내부 마감일정 정보 추가
      internal_deadline_date:
        matchingTextSchedule?.internal_deadline_date || null,
      internal_deadline_time:
        matchingTextSchedule?.internal_deadline_time || null,
      notice_date: matchingTextSchedule?.notice_date || null,
      notice_time: matchingTextSchedule?.notice_time || null,
      // 메타 정보
      has_internal_deadline: !!matchingTextSchedule,
      data_source: matchingTextSchedule ? "combined" : "official_only",
      combined_notes: [
        imageSchedule.notes || "공식 시험일정",
        matchingTextSchedule?.notes,
      ]
        .filter(Boolean)
        .join(" | "),
    });
  }

  // 매칭되지 않은 내부 마감일정들도 별도로 추가
  for (const textSchedule of textSchedules) {
    const alreadyMatched = combinedSchedules.some(
      (combined) =>
        combined.exam_type === textSchedule.exam_type &&
        textSchedule.session_numbers?.includes(combined.session_number)
    );

    if (!alreadyMatched) {
      // 내부 마감일정만 있는 경우 (공식 일정이 아직 없는 경우)
      for (const sessionNumber of textSchedule.session_numbers || []) {
        combinedSchedules.push({
          year: textSchedule.year,
          exam_type: textSchedule.exam_type,
          session_number: sessionNumber,
          session_range: textSchedule.session_range,
          // 공식 정보는 null
          registration_start_date: null,
          registration_end_date: null,
          exam_date: null,
          exam_time_start: null,
          exam_time_end: null,
          locations: [],
          // 내부 마감일정 정보
          internal_deadline_date: textSchedule.internal_deadline_date,
          internal_deadline_time: textSchedule.internal_deadline_time,
          notice_date: textSchedule.notice_date,
          notice_time: textSchedule.notice_time,
          // 메타 정보
          has_internal_deadline: true,
          data_source: "internal_only",
          notes: textSchedule.notes,
          combined_notes: textSchedule.notes,
        });
      }
    }
  }

  return combinedSchedules;
}

// 데모 데이터 생성 함수들 (API 할당량 초과시 사용)
function generateDemoOfficialSchedule(text: string): any[] {
  const currentYear = new Date().getFullYear();

  let examType = "생보";
  if (text.includes("손보") || text.includes("손해보험")) {
    examType = "손보";
  } else if (text.includes("제3") || text.includes("제삼")) {
    examType = "제3보험";
  }

  return [
    {
      year: currentYear,
      exam_type: examType,
      session_number: 1,
      registration_start_date: `${currentYear}-01-15`,
      registration_end_date: `${currentYear}-01-25`,
      exam_date: `${currentYear}-02-15`,
      exam_time_start: "10:00",
      exam_time_end: "12:00",
      locations: ["서울", "부산", "대구", "광주", "대전"],
      notes: "공식 시험일정 (데모 데이터)",
    },
  ];
}

function generateDemoInternalDeadline(text: string): any[] {
  const currentYear = new Date().getFullYear();

  let examType = "생보";
  if (text.includes("손보") || text.includes("손해보험")) {
    examType = "손보";
  } else if (text.includes("제3") || text.includes("제삼")) {
    examType = "제3보험";
  }

  const dateMatch = text.match(/(\d+)월\s*(\d+)일/);
  const month = dateMatch ? parseInt(dateMatch[1]) : 11;
  const day = dateMatch ? parseInt(dateMatch[2]) : 4;

  const timeMatch = text.match(/(오전|오후)\s*(\d+)시/);
  let hour = 11;
  if (timeMatch) {
    hour = parseInt(timeMatch[2]);
    if (timeMatch[1] === "오후" && hour !== 12) {
      hour += 12;
    } else if (timeMatch[1] === "오전" && hour === 12) {
      hour = 0;
    }
  }

  return [
    {
      year: currentYear,
      exam_type: examType,
      session_range: "1~4차",
      session_numbers: [1, 2, 3, 4],
      internal_deadline_date: `${currentYear}-${String(month).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`,
      internal_deadline_time: `${String(hour).padStart(2, "0")}:00`,
      notice_date: `${currentYear}-${String(month).padStart(2, "0")}-${String(
        day + 3
      ).padStart(2, "0")}`,
      notice_time: "14:00",
      locations: [],
      notes: "본사 자체 신청 마감일 (데모 데이터)",
    },
  ];
}
