
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const BusinessForm: React.FC = () => {
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Required information missing",
        description: "Please describe your business before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // This would typically connect to Supabase to store the data
    // For now we'll simulate a successful submission
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Since we don't have Supabase yet, generate a placeholder ID
      const tempId = Math.random().toString(36).substring(2, 15);
      
      toast({
        title: "Form submitted successfully",
        description: "Redirecting to your competitor report..."
      });
      
      // Redirect to the report page
      navigate(`/report/${tempId}`);
    } catch (error) {
      toast({
        title: "Error submitting form",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Describe your business in a few sentences
        </label>
        <Textarea
          id="description"
          placeholder="We create artisanal hot sauces with unique flavor profiles using locally sourced ingredients..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px]"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
          Optional: What keywords would you associate with your business?
        </label>
        <Input
          id="keywords"
          placeholder="artisanal, spicy, organic, small-batch, etc."
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <p className="text-xs text-gray-500">Enter keywords separated by commas</p>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-hotSauce-600 hover:bg-hotSauce-700 transition-colors"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Generating..." : "Generate Competitor Report"}
      </Button>
    </form>
  );
};

export default BusinessForm;
