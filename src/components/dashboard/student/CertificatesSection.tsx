import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock, Eye, Download, Search, GraduationCap, Trophy } from 'lucide-react';

interface Certificate {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'co_curricular';
  status: 'pending' | 'approved' | 'rejected';
  file_url: string;
  file_name: string;
  uploaded_at: string;
  rejection_reason?: string;
  remark?: string;
}

interface CertificatesSectionProps {
  certificates: Certificate[];
}

const CertificatesSection: React.FC<CertificatesSectionProps> = ({ certificates }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };

  const filteredCertificates = certificates.filter(cert =>
    cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const academicCertificates = filteredCertificates.filter(cert => cert.category === 'academic');
  const coCurricularCertificates = filteredCertificates.filter(cert => cert.category === 'co_curricular');

  const CertificateCard = ({ certificate }: { certificate: Certificate }) => (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(certificate.status)}
              <h3 className="font-semibold text-sm">{certificate.title}</h3>
            </div>
            {certificate.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {certificate.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {new Date(certificate.uploaded_at).toLocaleDateString()}
              </span>
              {getStatusBadge(certificate.status)}
            </div>
          </div>
        </div>
        
        {(certificate.status === 'approved' || certificate.status === 'rejected') && (certificate.remark || certificate.rejection_reason) && (
          <div className={`mt-3 p-2 border rounded text-xs ${certificate.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <strong className={certificate.status === 'rejected' ? 'text-red-800' : 'text-green-800'}>Faculty Remark:</strong>
            <p className={certificate.status === 'rejected' ? 'text-red-700 mt-1' : 'text-green-700 mt-1'}>{certificate.remark || certificate.rejection_reason}</p>
          </div>
        )}
        
        <div className="flex space-x-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(certificate.file_url, '_blank')}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              const link = document.createElement('a');
              link.href = certificate.file_url;
              link.download = certificate.file_name;
              link.click();
            }}
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const CertificateGrid = ({ certs, emptyMessage }: { certs: Certificate[], emptyMessage: string }) => (
    <div className="space-y-4">
      {certs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">My Certificates</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All ({filteredCertificates.length})
            </TabsTrigger>
            <TabsTrigger value="academic">
              <GraduationCap className="h-4 w-4 mr-1" />
              Academic ({academicCertificates.length})
            </TabsTrigger>
            <TabsTrigger value="co_curricular">
              <Trophy className="h-4 w-4 mr-1" />
              Co-Curricular ({coCurricularCertificates.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <CertificateGrid 
              certs={filteredCertificates} 
              emptyMessage="No certificates found. Upload your first certificate!" 
            />
          </TabsContent>
          
          <TabsContent value="academic" className="mt-6">
            <CertificateGrid 
              certs={academicCertificates} 
              emptyMessage="No academic certificates found. Upload your academic achievements!" 
            />
          </TabsContent>
          
          <TabsContent value="co_curricular" className="mt-6">
            <CertificateGrid 
              certs={coCurricularCertificates} 
              emptyMessage="No co-curricular certificates found. Upload your extracurricular activities!" 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CertificatesSection;
