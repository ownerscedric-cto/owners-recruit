"use client";

import { ExternalLink } from "lucide-react";
import { commonDocuments, newApplicantDocuments, experiencedApplicantDocuments, type Document, type DocumentLink } from "@/data/documents";

interface DocumentSummaryProps {
  type: "new" | "experienced";
}

export function DocumentSummary({ type }: DocumentSummaryProps) {
  const typeSpecificDocs = type === "new" ? newApplicantDocuments : experiencedApplicantDocuments;
  const allDocuments = [...commonDocuments, ...typeSpecificDocs];

  return (
    <div className="space-y-3">
      {allDocuments.map((doc, index) => (
        <div key={index} className="border-l-2 border-amber-300 pl-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="font-medium text-amber-700">{doc.name}</span>
              <p className="text-xs text-amber-600 mt-1 whitespace-pre-line">{doc.description}</p>

              {/* 단일 링크 */}
              {doc.link && (
                <a
                  href={doc.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {doc.link.text}
                </a>
              )}

              {/* 복수 링크 */}
              {doc.links && (
                <div className="mt-1 space-y-2">
                  {doc.links.map((link: DocumentLink, linkIndex: number) => (
                    <div key={linkIndex}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {link.text}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}