"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { FileText, Calendar, ExternalLink } from "lucide-react";
import { commonDocuments, newApplicantDocuments, experiencedApplicantDocuments, type DocumentLink } from "@/data/documents";
import { DatePicker } from "@/components/ui/date-picker";

interface DocumentGuideProps {
  type: "new" | "experienced";
  documentsConfirmed: boolean;
  documentPreparationDate: string;
  onDocumentsConfirmedChange: (confirmed: boolean) => void;
  onPreparationDateChange: (date: string) => void;
}

export function DocumentGuide({
  type,
  documentsConfirmed,
  documentPreparationDate,
  onDocumentsConfirmedChange,
  onPreparationDateChange,
}: DocumentGuideProps) {
  const typeSpecificDocs =
    type === "new" ? newApplicantDocuments : experiencedApplicantDocuments;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          필수 서류 안내
        </h4>
        <p className="text-sm text-blue-600">
          {type === "new" ? "신입자" : "경력자"} 입사에 필요한 서류를 확인하시고
          준비 예정일을 알려주세요.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">필수 서류 목록</h4>

        {/* 공통 서류 */}
        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">공통 필수 서류</h5>
          {commonDocuments.map((doc, index) => {
            return (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1">
                    <h6 className="font-medium text-gray-900">{doc.name}</h6>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                      {doc.description}
                    </p>
                    {doc.link && (
                      <a
                        href={doc.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {doc.link.text}
                      </a>
                    )}
                    {doc.links && (
                      <div className="mt-2 space-y-2">
                        {doc.links.map(
                          (link: DocumentLink, linkIndex: number) => (
                            <div key={linkIndex}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                {link.text}
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 구분별 서류 */}
        <div className="space-y-3">
          <h5 className="font-medium text-gray-700">
            {type === "new" ? "신입자 전용 서류" : "경력자 전용 서류"}
          </h5>
          {typeSpecificDocs.map((doc, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg ${
                type === "new"
                  ? "border-green-200 bg-green-50"
                  : "border-purple-200 bg-purple-50"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <h6
                    className={`font-medium ${
                      type === "new" ? "text-green-900" : "text-purple-900"
                    }`}
                  >
                    {doc.name}
                  </h6>
                  <p
                    className={`text-sm mt-1 whitespace-pre-line ${
                      type === "new" ? "text-green-700" : "text-purple-700"
                    }`}
                  >
                    {doc.description}
                  </p>
                  {doc.link && (
                    <a
                      href={doc.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {doc.link.text}
                    </a>
                  )}
                  {doc.links && (
                    <div className="mt-2 space-y-2">
                      {doc.links.map(
                        (link: DocumentLink, linkIndex: number) => (
                          <div key={linkIndex}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              {link.text}
                            </a>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 확인 및 날짜 선택 */}
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="documentsConfirmed"
                checked={documentsConfirmed}
                onChange={(e) => onDocumentsConfirmedChange(e.target.checked)}
                className="mt-1 rounded border-gray-300"
              />
              <div className="flex-1">
                <Label
                  htmlFor="documentsConfirmed"
                  className="font-medium text-amber-800"
                >
                  위 필수 서류를 모두 확인하였습니다.
                </Label>
                <p className="text-sm text-amber-700 mt-1">
                  모든 서류를 준비할 수 있는지 확인해주세요.
                </p>
              </div>
            </div>

            {documentsConfirmed && (
              <div>
                <Label
                  htmlFor="documentPreparationDate"
                  className="flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  서류 준비 완료 예정일 *
                </Label>
                <DatePicker
                  id="documentPreparationDate"
                  value={documentPreparationDate}
                  onChange={onPreparationDateChange}
                  min={new Date().toISOString().split("T")[0]}
                  placeholder="서류 준비 완료 예정일 선택"
                  className="mt-1"
                />
                <p className="text-sm text-amber-600 mt-1">
                  서류 준비가 완료되는 예정일을 선택해주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
