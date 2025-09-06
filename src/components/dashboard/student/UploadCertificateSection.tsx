import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';

interface UploadCertificateSectionProps {
  onUploadComplete: () => void;
}

const UploadCertificateSection: React.FC<UploadCertificateSectionProps> = ({ onUploadComplete }) => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  // Upload form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'academic' | 'co_curricular'>('academic');
  const [file, setFile] = useState<File | null>(null);

  const uploadCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !profile) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName);

      // Insert certificate record
      const { error: insertError } = await supabase
        .from('certificates')
        .insert({
          student_id: profile.id,
          title,
          description,
          category,
          file_url: publicUrl,
          file_name: file.name,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Certificate uploaded successfully!',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('academic');
      setFile(null);
      
      // Notify parent component
      onUploadComplete();
    } catch (error: any) {
      console.error('Error uploading certificate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload certificate',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Certificate</span>
        </CardTitle>
        <CardDescription>
          Upload your academic or co-curricular certificates for verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={uploadCertificate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Certificate Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Computer Science Degree"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value: 'academic' | 'co_curricular') => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="co_curricular">Co-Curricular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the certificate..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file">Certificate File (PDF/JPEG)</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          
          <Button type="submit" disabled={uploading || !file} className="w-full">
            {uploading ? 'Uploading...' : 'Upload Certificate'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadCertificateSection;