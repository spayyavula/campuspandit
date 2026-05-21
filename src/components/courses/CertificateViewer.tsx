import React from 'react';
import { Award, Download, ExternalLink, Clock } from 'lucide-react';

interface CertificateViewerProps {
  enrollmentId: string;
  certificateUrl?: string | null;
  issuedAt?: string | null;
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({
  enrollmentId,
  certificateUrl,
  issuedAt,
}) => {
  const formattedDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  if (!certificateUrl) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 border border-yellow-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Certificate is being prepared
            </h3>
            <p className="text-sm text-gray-600">
              Your completion certificate will be available here shortly. Enrollment ID:{' '}
              <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{enrollmentId}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 border border-yellow-200">
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
          <Award className="w-8 h-8 text-yellow-600" />
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            Certificate of Completion
          </h3>
          {formattedDate && (
            <p className="text-sm text-gray-500 mb-4">Issued on {formattedDate}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <a
              href={certificateUrl}
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download certificate
            </a>
            <a
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View in new tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;
