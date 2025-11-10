interface DocumentLink {
  url: string;
  text: string;
}

interface Document {
  name: string;
  description: string;
  link?: DocumentLink;
  links?: DocumentLink[];
}

// 공통 서류
export const commonDocuments: Document[] = [
  {
    name: "주민등록 등/초본",
    description: "발급용, 주민번호 전체 표시",
  },
  {
    name: "신분증 사본",
    description: "앞면만 제출",
  },
  {
    name: "통장사본",
    description: "급여 입금용 계좌",
  },
  {
    name: "독후감",
    description: "영업 관련 서적, A4 한 장 정도",
  },
  {
    name: "생명보험시험 합격증",
    description: "생명보험협회에서 확인 가능",
    link: {
      url: "https://exam.insure.or.kr/",
      text: "자격시험센터 바로가기",
    },
  },
];

// 신입자 전용
export const newApplicantDocuments: Document[] = [
  {
    name: "졸업증명서",
    description: "최종 학력 증명",
  },
  {
    name: "보험연수원 교육수료증 (신규)",
    description:
      "• 생명보험 코드만 신청: 생명 + 제3보험 (30H)\n• 생명보험/손해보험 코드 신청: 생명 + 손해 + 제3보험 (40H)",
    link: {
      url: "https://is.in.or.kr/main/sukang/reg/compTrainning.do?lecture_type=1&search_gubun_code=01&search_high_code=04&search_mid_code=01",
      text: "보험연수원 신규교육 바로가기",
    },
  },
];

// 경력자 전용
export const experiencedApplicantDocuments: Document[] = [
  {
    name: "경력증명서",
    description: "이전 보험회사 재직 증명",
  },
  {
    name: "말소증명서",
    description: "기존 생명보험협회, 손해보험협회에 등록한 보험사 말소신청",
    links: [
      {
        url: "https://fp.insure.or.kr/register/privacy",
        text: "생명보험협회 등록/말소 이력조회",
      },
      {
        url: "https://isi.knia.or.kr/confirm/login.do",
        text: "손해보험협회 말소 증명서 신청",
      },
    ],
  },
  {
    name: "보험연수원 교육수료증 (경력)",
    description:
      "• 생명보험 코드만 신청: 생명 + 제3보험 (25H)\n• 생명보험/손해보험 코드 신청: 생명 + 손해 + 제3보험 (30H)",
    link: {
      url: "https://is.in.or.kr/main/sukang/reg/compTrainning.do?lecture_type=1&search_gubun_code=01&search_high_code=05&search_mid_code=01",
      text: "보험연수원 경력교육 바로가기",
    },
  },
];

export type { Document, DocumentLink };