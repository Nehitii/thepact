import { useState } from "react";
import { ArrowLeft, Shield, FileText, Scale, AlertTriangle, Users, Lock, Mail, Heart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
export default function Legal() {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  const [showFirstConfirm, setShowFirstConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/profile');
    }
  };
  const handleFirstConfirm = () => {
    setShowFirstConfirm(false);
    setShowFinalConfirm(true);
  };
  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;
    if (!user) return;
    setDeleting(true);
    try {
      // Delete user data from all tables
      await Promise.all([supabase.from('profiles').delete().eq('id', user.id), supabase.from('pacts').delete().eq('user_id', user.id), supabase.from('ranks').delete().eq('user_id', user.id), supabase.from('finance').delete().eq('user_id', user.id), supabase.from('recurring_expenses').delete().eq('user_id', user.id), supabase.from('recurring_income').delete().eq('user_id', user.id), supabase.from('journal_entries').delete().eq('user_id', user.id), supabase.from('user_achievements').delete().eq('user_id', user.id), supabase.from('user_cosmetics').delete().eq('user_id', user.id), supabase.from('user_module_purchases').delete().eq('user_id', user.id), supabase.from('bond_balance').delete().eq('user_id', user.id), supabase.from('bond_transactions').delete().eq('user_id', user.id), supabase.from('achievement_tracking').delete().eq('user_id', user.id), supabase.from('monthly_finance_validations').delete().eq('user_id', user.id), supabase.from('pact_spending').delete().eq('user_id', user.id), supabase.from('user_roles').delete().eq('user_id', user.id)]);

      // Sign out and redirect
      await signOut();
      toast.success("Account deleted successfully");
      navigate('/auth');
    } catch (error: any) {
      toast.error("Failed to delete account: " + (error.message || "Unknown error"));
    } finally {
      setDeleting(false);
      setShowFinalConfirm(false);
      setConfirmText("");
    }
  };
  return <div className="min-h-screen bg-[#00050B] relative overflow-hidden">
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

      <ScrollArea className="h-screen">
        <div className="max-w-2xl mx-auto p-6 space-y-6 relative z-10 pb-12">
          {/* Header */}
          <div className="pt-8 space-y-4 animate-fade-in">
            <button onClick={handleBack} className="flex items-center gap-2 text-[#6b9ec4] hover:text-[#8ACBFF] transition-colors font-rajdhani">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary uppercase tracking-widest drop-shadow-[0_0_20px_rgba(91,180,255,0.6)] font-orbitron">
              Terms & Legal
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
                <div className="text-[#a8c8e8] font-rajdhani space-y-3 text-sm leading-relaxed">
                  <p className="text-[#c8e0f4] font-medium">© 2024–2025 The Pact. All rights reserved.</p>
                  <p>All content, visual elements, interface designs, animations, logos, texts, graphics, source code, and functionality within this application are the exclusive intellectual property of The Pact and its creators.</p>
                  <p>Any unauthorized reproduction, distribution, modification, reverse engineering, or reuse of any part of the application, in whole or in part, is strictly prohibited without prior written consent.</p>
                </div>
              </div>
            </div>

            {/* Terms of Service Section */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
              <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                  <h2 className="text-xl font-orbitron font-semibold text-[#8ACBFF]">Terms of Service</h2>
                </div>
                <div className="text-[#a8c8e8] font-rajdhani space-y-4 text-sm leading-relaxed">
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">1. Acceptance of Terms</p>
                    <p>By accessing or using The Pact, you agree to comply with and be bound by these Terms of Service, all applicable laws and regulations, and any additional guidelines provided within the application.</p>
                    <p className="mt-1 text-[#8ACBFF]/80 italic">If you do not agree with these terms, you must discontinue use of the application.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">2. Purpose of the Application</p>
                    <p>The Pact is a personal development, organization, and progression application designed to help users track goals, habits, finances, and personal growth.</p>
                    <p className="mt-1">The application is intended for lawful, personal, and responsible use only.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">3. User Responsibility & Accountability</p>
                    <p>You are solely responsible for all content you create, upload, store, or share within the application, including but not limited to:</p>
                    <ul className="mt-2 ml-4 space-y-1 text-[#8ACBFF]/90">
                      <li>• Goals and plans</li>
                      <li>• Notes and personal reflections</li>
                      <li>• Financial data</li>
                      <li>• Messages exchanged with other users</li>
                      <li>• Images or media</li>
                    </ul>
                    <p className="mt-2">The Pact does not verify, validate, or endorse user-generated content. All actions, interpretations, and decisions made using the application remain under your full responsibility.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">4. Prohibited Use</p>
                    <p className="mb-2">The Pact must not be used to:</p>
                    <ul className="ml-4 space-y-1 text-[#ff6b6b]/80">
                      <li>• Plan, organize, promote, or facilitate illegal activities</li>
                      <li>• Store or distribute unlawful, harmful, abusive, fraudulent, or misleading content</li>
                      <li>• Violate any local, national, or international law</li>
                      <li>• Infringe on the rights, privacy, or safety of others</li>
                      <li>• Misuse financial tools for illegal, deceptive, or unethical purposes</li>
                      <li>• Harass, threaten, or abuse other users</li>
                    </ul>
                    <p className="mt-2 text-[#ff6b6b]/90 font-medium">Any attempt to divert the application from its intended lawful use is strictly forbidden.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">5. Enforcement & Sanctions</p>
                    <p className="mb-2">The Pact reserves the right to take appropriate action in case of misuse, including but not limited to:</p>
                    <ul className="ml-4 space-y-1 text-[#8ACBFF]/90">
                      <li>• Temporary suspension of access</li>
                      <li>• Permanent account termination</li>
                      <li>• Removal of content</li>
                      <li>• Restriction of features</li>
                      <li>• Cooperation with legal authorities when required by law</li>
                    </ul>
                    <p className="mt-2">Users who deliberately misuse the platform or attempt to bypass safeguards may be sanctioned without prior notice.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">6. No Professional Advice Disclaimer</p>
                    <p className="mb-2">The Pact does not provide:</p>
                    <ul className="ml-4 space-y-1 text-[#8ACBFF]/90">
                      <li>• Legal advice</li>
                      <li>• Financial advice</li>
                      <li>• Medical advice</li>
                      <li>• Psychological or professional counseling</li>
                    </ul>
                    <p className="mt-2">All information, projections, statistics, or insights provided by the application are informational only. You remain fully responsible for your decisions and actions.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Data Protection Section */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
              <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                  <h2 className="text-xl font-orbitron font-semibold text-[#8ACBFF]">Privacy & Data Protection</h2>
                </div>
                <div className="text-[#a8c8e8] font-rajdhani space-y-4 text-sm leading-relaxed">
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">7. Data Collection</p>
                    <p className="mb-2">We collect only the data necessary to operate and improve the application, including:</p>
                    <ul className="ml-4 space-y-1 text-[#8ACBFF]/90">
                      <li>• Account information</li>
                      <li>• Usage data</li>
                      <li>• Preferences and settings</li>
                      <li>• Optional user-generated content</li>
                    </ul>
                    <p className="mt-2">No unnecessary or excessive data is collected.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">8. Data Protection & Security</p>
                    <p>Your data is encrypted and stored using reasonable industry-standard security measures.</p>
                    <p className="mt-1">While we take security seriously, no system can guarantee absolute protection.</p>
                    <p className="mt-1 text-[#8ACBFF]/80 italic">You are responsible for maintaining the confidentiality of your login credentials.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">9. Your Rights</p>
                    <p className="mb-2">In accordance with applicable data protection regulations (including GDPR where applicable), you have the right to:</p>
                    <ul className="ml-4 space-y-1 text-[#8ACBFF]/90">
                      <li>• Access your personal data</li>
                      <li>• Correct or update your data</li>
                      <li>• Request deletion of your data</li>
                      <li>• Export your data where technically feasible</li>
                    </ul>
                    <p className="mt-2">These actions can be performed through your Profile settings or by contacting support.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">10. Data Deletion & Account Removal</p>
                    <p>You may request full account deletion at any time.</p>
                    <p className="mt-2 mb-1">Upon deletion:</p>
                    <ul className="ml-4 space-y-1 text-[#8ACBFF]/90">
                      <li>• Your account will be permanently removed</li>
                      <li>• Your personal data will be deleted within a reasonable timeframe</li>
                      <li>• Some data may be temporarily retained if legally required (e.g. security, fraud prevention)</li>
                    </ul>
                    <p className="mt-2 text-[#ff6b6b]/80 font-medium">Deleted data cannot be recovered.</p>
                    
                    {/* Delete Account Button */}
                    <div className="mt-4 pt-4 border-t border-primary/10">
                      <Button onClick={() => setShowFirstConfirm(true)} variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 font-rajdhani">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Interactions Section */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
              <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                  <h2 className="text-xl font-orbitron font-semibold text-[#8ACBFF]">User Interactions & Third Parties</h2>
                </div>
                <div className="text-[#a8c8e8] font-rajdhani space-y-4 text-sm leading-relaxed">
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">11. User-to-User Interactions</p>
                    <p className="mb-2">When interacting with other users:</p>
                    <ul className="ml-4 space-y-1 text-[#8ACBFF]/90">
                      <li>• You remain fully responsible for your communications</li>
                      <li>• The Pact does not actively monitor conversations</li>
                      <li>• Abuse, harassment, or misuse may result in sanctions</li>
                    </ul>
                    <p className="mt-2">Blocking and reporting tools are provided to protect users.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">12. Third Parties</p>
                    <p className="text-[#8ACBFF] font-medium">We do not sell your personal data.</p>
                    <p className="mt-1">Data may be shared with trusted service providers solely for operational purposes (hosting, analytics, payments), under strict confidentiality obligations.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Liability & Modifications Section */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
              <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                  <h2 className="text-xl font-orbitron font-semibold text-[#8ACBFF]">Liability & Modifications</h2>
                </div>
                <div className="text-[#a8c8e8] font-rajdhani space-y-4 text-sm leading-relaxed">
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">13. Limitation of Liability</p>
                    <p className="mb-2">The Pact shall not be held liable for:</p>
                    <ul className="ml-4 space-y-1 text-[#8ACBFF]/90">
                      <li>• User-generated content</li>
                      <li>• Decisions made based on application data or projections</li>
                      <li>• Financial or personal outcomes</li>
                      <li>• Misuse of the application</li>
                      <li>• Data loss caused by user error</li>
                    </ul>
                    <p className="mt-2 text-[#ff6b6b]/80 italic">Use of the application is at your own risk.</p>
                  </div>
                  
                  <div>
                    <p className="text-[#c8e0f4] font-medium mb-1">14. Modifications to These Terms</p>
                    <p>We reserve the right to update these Terms & Legal at any time.</p>
                    <p className="mt-1">Significant changes will be communicated through the application.</p>
                    <p className="mt-1 text-[#8ACBFF]/80 italic">Continued use of The Pact constitutes acceptance of the updated terms.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-sm opacity-50" />
              <div className="relative bg-[#0a1525]/80 border border-primary/20 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                  <h2 className="text-xl font-orbitron font-semibold text-[#8ACBFF]">Contact</h2>
                </div>
                <div className="text-[#a8c8e8] font-rajdhani space-y-2 text-sm leading-relaxed">
                  <p className="text-[#c8e0f4] font-medium">15. Contact</p>
                  <p>For legal inquiries, data requests, or account-related issues:</p>
                  <a href="mailto:legal@thepact.app" className="inline-block mt-2 text-primary hover:text-[#8ACBFF] transition-colors font-medium">
                    legal@thepact.app
                  </a>
                </div>
              </div>
            </div>

            {/* Final Statement */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-xl blur-sm opacity-60" />
              <div className="relative bg-[#0a1525]/90 border border-primary/30 rounded-xl p-6 text-center">
                <Heart className="h-6 w-6 text-primary mx-auto mb-3 drop-shadow-[0_0_8px_rgba(91,180,255,0.5)]" />
                <p className="text-[#c8e0f4] font-rajdhani text-sm leading-relaxed italic">
                  The Pact is built as a tool for clarity, discipline, and personal responsibility.<br />
                  <span className="text-[#8ACBFF]">Respect for the law, for others, and for oneself is fundamental to its use.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer with Version Info */}
          <div className="text-center pt-6 pb-4 space-y-2">
            <div className="text-xs text-[#6b9ec4]/60 font-rajdhani">
              Last updated: January 2026
            </div>
            <div className="text-[10px] text-[#6b9ec4]/40 font-rajdhani tracking-wider">
              Version V3.0 — The Pact · Author: G.L
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* First Confirmation Dialog */}
      <AlertDialog open={showFirstConfirm} onOpenChange={setShowFirstConfirm}>
        <AlertDialogContent className="bg-[#0a1525]/95 backdrop-blur-xl border border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#ff6b6b] font-orbitron flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#a8c8e8] font-rajdhani space-y-2">
              <p>You are about to permanently delete your account.</p>
              <p className="text-[#ff6b6b]/80 font-medium">This action cannot be undone. All your data, goals, journal entries, and progress will be permanently removed.</p>
              <p>Are you sure you want to continue?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white font-rajdhani">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstConfirm} className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20 font-rajdhani">
              Yes, Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
        <AlertDialogContent className="bg-[#0a1525]/95 backdrop-blur-xl border border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#ff6b6b] font-orbitron flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Final Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#a8c8e8] font-rajdhani space-y-3">
              <p className="text-[#ff6b6b] font-medium">This is your final chance to cancel.</p>
              <p>To confirm deletion, type <span className="text-white font-bold">DELETE</span> below:</p>
              <Input value={confirmText} onChange={e => setConfirmText(e.target.value.toUpperCase())} placeholder="Type DELETE to confirm" className="bg-[#0d1a2d]/90 border-red-500/30 text-white placeholder:text-[#6b9ec4]/50 font-mono" />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")} className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white font-rajdhani">
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleDeleteAccount} disabled={confirmText !== "DELETE" || deleting} className="bg-red-500/30 text-red-300 hover:bg-red-500/40 border border-red-500/30 font-rajdhani disabled:opacity-50 disabled:cursor-not-allowed">
              {deleting ? "Deleting..." : "Delete Forever"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}