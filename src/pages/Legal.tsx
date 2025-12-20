import { ArrowLeft, Shield, FileText, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
export default function Legal() {
  const navigate = useNavigate();
  const handleBack = () => {
    // Check if there's history to go back to, otherwise go to profile
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };
  return <div className="min-h-screen pb-20 bg-[#00050B] relative overflow-hidden">
      {/* Deep space background with radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Sci-fi grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
        backgroundImage: `
            linear-gradient(rgba(91, 180, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91, 180, 255, 0.1) 1px, transparent 1px)
          `,
        backgroundSize: '50px 50px'
      }} />
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="pt-8 space-y-4 animate-fade-in">
          <button onClick={handleBack} className="flex items-center gap-2 text-[#6b9ec4] hover:text-[#8ACBFF] transition-colors font-rajdhani">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
            Legal & Terms
          </h1>
          <p className="text-[#6b9ec4] tracking-wide font-rajdhani">Copyright, Terms of Service & Privacy</p>
        </div>

        {/* Legal Sections */}
        <div className="space-y-6">
          {/* Copyright Section */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-[#8ACBFF]">Copyright</h2>
              </div>
              <div className="text-[#a8c8e8] font-rajdhani space-y-2 text-sm leading-relaxed">
                <p>© 2024 The Pact. All rights reserved.</p>
                <p>All content, design elements, graphics, and functionality within this application are the intellectual property of The Pact and its creators.</p>
                <p>Unauthorized reproduction, distribution, or modification of any content is strictly prohibited without prior written consent.</p>
              </div>
            </div>
          </div>

          {/* Terms of Service Section */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-[#8ACBFF]">Terms of Service</h2>
              </div>
              <div className="text-[#a8c8e8] font-rajdhani space-y-3 text-sm leading-relaxed">
                <p><strong className="text-[#c8e0f4]">1. Acceptance of Terms</strong><br />By accessing and using The Pact, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                <p><strong className="text-[#c8e0f4]">2. User Responsibilities</strong><br />Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.</p>
                <p><strong className="text-[#c8e0f4]">3. Prohibited Use</strong><br />Users may not use the application for any unlawful purpose or in any way that could damage, disable, or impair the service.</p>
                <p><strong className="text-[#c8e0f4]">4. Data & Privacy</strong><br />Your personal data is handled in accordance with our Privacy Policy. We are committed to protecting your information.</p>
                <p><strong className="text-[#c8e0f4]">5. Modifications</strong><br />We reserve the right to modify these terms at any time. Continued use of the application constitutes acceptance of modified terms.</p>
              </div>
            </div>
          </div>

          {/* Privacy & Regulations Section */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
            <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <h2 className="text-xl font-orbitron font-semibold text-[#8ACBFF]">Privacy & Regulations</h2>
              </div>
              <div className="text-[#a8c8e8] font-rajdhani space-y-3 text-sm leading-relaxed">
                <p><strong className="text-[#c8e0f4]">Data Collection</strong><br />We collect only the information necessary to provide and improve our services, including account details, usage data, and preferences.</p>
                <p><strong className="text-[#c8e0f4]">Data Protection</strong><br />Your data is encrypted and stored securely. We implement industry-standard security measures to protect your information.</p>
                <p><strong className="text-[#c8e0f4]">Your Rights</strong><br />You have the right to access, correct, or delete your personal data at any time through your Profile settings.</p>
                <p><strong className="text-[#c8e0f4]">Third Parties</strong><br />We do not sell your personal information to third parties. Data may be shared with service providers solely for operational purposes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 text-xs text-[#6b9ec4]/60 font-rajdhani">
          Last updated: December 2025
        </div>
      </div>

      <Navigation />
    </div>;
}