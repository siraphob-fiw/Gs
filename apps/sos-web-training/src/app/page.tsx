'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';
import { Button } from '@heroui/react';
import { HomeLayout } from '@/components/layout/homeLayout';
import { useRoleAccess } from '@/hooks/api/use-role-access';
import { useColorScheme } from '@/lib/color-utils';

function HomePageContent() {
  const { switchScheme } = useColorScheme();
  useEffect(() => {
    switchScheme('default');
  }, []);

  const { state } = useAuth();
  const user = state.user;
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<{ url: string; label: string } | null>(null);
  const { isAdmin } = useRoleAccess();

  useEffect(() => {
    if (user) {
      if (isAdmin()) {
        setRedirectUrl({ url: '/admin', label: 'Go to Dashboard' });
      } else {
        setRedirectUrl({ url: '/dashboard', label: 'Go to Dashboard' });
      }
    } else {
      setRedirectUrl({ url: '/login', label: 'Login' });
    }
  }, [user]);

  return (
    <HomeLayout>
      <div className={`w-full mx-auto pt-[80px] px-4 pb-8`}>
        <section className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-10 my-8">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-primary-700 text-center md:text-left drop-shadow">
              Elevate Your Training <br />
              <span className="text-primary-600">Unleash Your Coaching</span>
            </h1>
            <p className="mb-8 text-gray-700 text-center md:text-left max-w-lg">
              Coaching tools, athlete management, and adaptive programs all in one platform.
              <br />
              Join StrengthOS Training to transform your strength journey today.
            </p>
            <Button
              color="primary"
              variant="solid"
              onPress={() => router.push(redirectUrl?.url || '/login')}
              className="font-semibold px-6 py-3 rounded-lg shadow"
            >
              {redirectUrl?.label}
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Image
              src="/images/gym_generate.png"
              alt="StrengthOS Logo"
              className="shadow-lg rounded-lg border"
              width={288}
              height={128}
              priority
              style={{ width: '288px', height: 'auto' }}
            />
          </div>
        </section>
      </div>

      <section className="container mx-auto px-4 py-8">
        <div className="text-2xl md:text-3xl font-semibold text-center text-text mb-8">
          What we offer
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="relative bg-white rounded-xl shadow-lg overflow-hidden flex flex-col justify-end border border-zinc-100 min-h-[290px] transition-transform duration-200 hover:scale-[1.03] hover:shadow-2xl group">
            <div className="absolute inset-0 w-full h-full z-0">
              <Image
                src="/images/access-coaching.png"
                alt="Coaching"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover w-full h-full transition group-hover:brightness-75"
                priority
                style={{ filter: 'brightness(0.65)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-100/85 via-slate-100/70 to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col items-center pt-16 pb-7 px-7 w-full">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1 text-center drop-shadow">
                Coaching
              </h3>
              <p className="text-gray-600 text-center text-base mb-5 leading-relaxed drop-shadow-sm">
                Personalized programs tailored to your goals.
              </p>
              <button className="bg-primary-600 hover:bg-primary-700 text-white text-base font-medium px-5 py-2 rounded shadow transition focus:outline-none focus:ring-2 focus:ring-primary-400">
                Learn More
              </button>
            </div>
          </div>
          {/* Card 2 */}
          <div className="relative bg-white rounded-xl shadow-lg overflow-hidden flex flex-col justify-end border border-zinc-100 min-h-[290px] transition-transform duration-200 hover:scale-[1.03] hover:shadow-2xl group">
            <div className="absolute inset-0 w-full h-full z-0">
              <Image
                src="/images/classroom-tip.png"
                alt="Efficient Programs"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover w-full h-full transition group-hover:brightness-75"
                priority
                style={{ filter: 'brightness(0.65)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-100/85 via-slate-100/70 to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col items-center pt-16 pb-7 px-7 w-full">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1 text-center drop-shadow">
                Efficient Programs
              </h3>
              <p className="text-gray-600 text-center text-base mb-5 leading-relaxed drop-shadow-sm">
                Smart, expertly crafted training plans tailored to your goals.
              </p>
              <button className="bg-primary-600 hover:bg-primary-700 text-white text-base font-medium px-5 py-2 rounded shadow transition focus:outline-none focus:ring-2 focus:ring-primary-400">
                Learn More
              </button>
            </div>
          </div>
          {/* Card 3 */}
          <div className="relative bg-white rounded-xl shadow-lg overflow-hidden flex flex-col justify-end border border-zinc-100 min-h-[290px] transition-transform duration-200 hover:scale-[1.03] hover:shadow-2xl group">
            <div className="absolute inset-0 w-full h-full z-0">
              <Image
                src="/images/adaptive-program.png"
                alt="Adaptive Templates"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover w-full h-full transition group-hover:brightness-75"
                priority
                style={{ filter: 'brightness(0.65)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-100/85 via-slate-100/70 to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col items-center pt-16 pb-7 px-7 w-full">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1 text-center drop-shadow">
                Adaptive Templates
              </h3>
              <p className="text-gray-600 text-center text-base mb-5 leading-relaxed drop-shadow-sm">
                Intelligent templates that adjust to you for optimal performance.
              </p>
              <button className="bg-primary-600 hover:bg-primary-700 text-white text-base font-medium px-5 py-2 rounded shadow transition focus:outline-none focus:ring-2 focus:ring-primary-400">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What Can StrengthOS Do? */}
      <section className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center py-10 px-4">
          <div className="w-48 max-w-full mb-4">
            <Image
              src="/images/logos/humansOS.svg"
              alt="StrengthOS Logo"
              width={192}
              height={96}
              priority
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900 text-center">
            Welcome to StrengthOS Training!
          </h1>
          <p className="mb-8 text-gray-700 text-center max-w-xl">
            Your hub for strength coaching, athlete management, and program design. Get started by
            selecting a feature from the sidebar.
          </p>
          <div>
            <Button
              color="primary"
              variant="solid"
              onPress={() => router.push(redirectUrl?.url || '/login')}
              className="font-semibold px-6 py-3 rounded-lg shadow"
            >
              {redirectUrl?.label}
            </Button>
          </div>
        </div>
      </section>
    </HomeLayout>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
