import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ExternalLink, BookOpen, Trophy, Users, Star } from 'lucide-react';

interface Certificate {
  category: 'academic' | 'co_curricular';
  status: 'pending' | 'approved' | 'rejected';
}

interface RecommendationsSectionProps {
  certificates: Certificate[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'co_curricular';
  type: 'course' | 'competition' | 'certification' | 'event' | 'club' | 'volunteering';
  priority: 'high' | 'medium' | 'low';
  actionLabel: string;
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ certificates }) => {
  // Generate recommendations based on user's certificates
  const generateRecommendations = (): Recommendation[] => {
    const approvedCertificates = certificates.filter(cert => cert.status === 'approved');
    const academicCount = approvedCertificates.filter(cert => cert.category === 'academic').length;
    const coCurricularCount = approvedCertificates.filter(cert => cert.category === 'co_curricular').length;
    
    const recommendations: Recommendation[] = [];

    // Academic recommendations
    if (academicCount >= 3) {
      recommendations.push({
        id: '1',
        title: 'Advanced Data Science Certification',
        description: 'Based on your strong academic performance, consider pursuing advanced certifications in emerging fields.',
        category: 'academic',
        type: 'certification',
        priority: 'high',
        actionLabel: 'Learn More'
      });
      recommendations.push({
        id: '2',
        title: 'Research Project Opportunities',
        description: 'Join ongoing research projects to enhance your academic portfolio and gain practical experience.',
        category: 'academic',
        type: 'course',
        priority: 'medium',
        actionLabel: 'Apply'
      });
    } else if (academicCount >= 1) {
      recommendations.push({
        id: '3',
        title: 'Programming Fundamentals Course',
        description: 'Strengthen your technical foundation with comprehensive programming courses.',
        category: 'academic',
        type: 'course',
        priority: 'high',
        actionLabel: 'Enroll'
      });
    } else {
      recommendations.push({
        id: '4',
        title: 'Academic Writing Workshop',
        description: 'Start building your academic portfolio with essential writing and research skills.',
        category: 'academic',
        type: 'course',
        priority: 'high',
        actionLabel: 'Register'
      });
    }

    // Co-curricular recommendations
    if (coCurricularCount >= 2) {
      recommendations.push({
        id: '5',
        title: 'Leadership Development Program',
        description: 'Your active participation in co-curricular activities makes you a great candidate for leadership roles.',
        category: 'co_curricular',
        type: 'event',
        priority: 'high',
        actionLabel: 'Apply'
      });
      recommendations.push({
        id: '6',
        title: 'Inter-University Competition',
        description: 'Represent your institution in prestigious competitions and showcase your talents.',
        category: 'co_curricular',
        type: 'competition',
        priority: 'medium',
        actionLabel: 'Participate'
      });
    } else if (coCurricularCount >= 1) {
      recommendations.push({
        id: '7',
        title: 'Community Service Initiative',
        description: 'Expand your co-curricular involvement through meaningful community service projects.',
        category: 'co_curricular',
        type: 'volunteering',
        priority: 'medium',
        actionLabel: 'Join'
      });
    } else {
      recommendations.push({
        id: '8',
        title: 'Student Clubs & Organizations',
        description: 'Start your co-curricular journey by joining clubs that align with your interests.',
        category: 'co_curricular',
        type: 'club',
        priority: 'high',
        actionLabel: 'Explore'
      });
    }

    // General recommendations
    recommendations.push({
      id: '9',
      title: 'Skill Assessment Workshop',
      description: 'Identify your strengths and areas for improvement with comprehensive skill evaluation.',
      category: 'academic',
      type: 'course',
      priority: 'low',
      actionLabel: 'Schedule'
    });

    return recommendations.slice(0, 6); // Return top 6 recommendations
  };

  const recommendations = generateRecommendations();

  const getCategoryIcon = (category: string) => {
    return category === 'academic' ? <BookOpen className="h-4 w-4" /> : <Trophy className="h-4 w-4" />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
      case 'certification':
        return <BookOpen className="h-4 w-4" />;
      case 'competition':
        return <Trophy className="h-4 w-4" />;
      case 'club':
      case 'event':
        return <Users className="h-4 w-4" />;
      case 'volunteering':
        return <Star className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-xl font-bold">
          <Lightbulb className="h-5 w-5" />
          <span>Recommendations for You</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="transition-all hover:shadow-md border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(rec.category)}
                    <h3 className="font-semibold text-sm">{rec.title}</h3>
                  </div>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {rec.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    {getTypeIcon(rec.type)}
                    <span className="capitalize">{rec.type}</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    {rec.actionLabel}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {recommendations.length === 0 && (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Upload some certificates to get personalized recommendations!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationsSection;