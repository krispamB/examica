import LandingHeader from '@/components/landing/LandingHeader'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import UserRolesSection from '@/components/landing/UserRolesSection'
import AcademicIntegritySection from '@/components/landing/AcademicIntegritySection'
import ResourcesSection from '@/components/landing/ResourcesSection'
import LandingFooter from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <LandingHeader />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Platform Features */}
        <FeaturesSection />

        {/* User Roles Section */}
        <UserRolesSection />

        {/* Academic Integrity & Security */}
        <AcademicIntegritySection />

        {/* Resources & Support */}
        <ResourcesSection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
