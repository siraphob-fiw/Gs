'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { useTranslation } from '@/hooks/api/useTranslation';
import { useColorScheme } from '@/lib/color-utils';

export type AuthMethod = 'EMAIL' | 'WHATSAPP' | 'LINE' | 'OAUTH';

interface AuthMethodSelectorProps {
  onMethodSelect: (method: AuthMethod) => void;
  isLoading?: boolean;
  availableMethods?: AuthMethod[];
}

const EmailIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

const LineIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12.017.572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

export const GoogleIcon = () => {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
};


export const AuthMethodSelector: React.FC<AuthMethodSelectorProps> = ({
  onMethodSelect,
  isLoading = false,
  availableMethods = ['EMAIL', 'WHATSAPP', 'LINE', 'OAUTH'],
}) => {
  const { t } = useTranslation();
  const { currentScheme } = useColorScheme();
  const [theme, setTheme] = useState('default');

  useEffect(() => {
    setTheme(currentScheme);
  }, [currentScheme]);

  const methodConfig = {
    EMAIL: {
      icon: <EmailIcon />,
      title: t('auth.methods.email.title', 'Email & Password'),
      description: t('auth.methods.email.description', 'Sign in with your email address'),
      color: 'bg-info hover:bg-infoHover text-white',
    },
    WHATSAPP: {
      icon: <WhatsAppIcon />,
      title: t('auth.methods.whatsapp.title', 'WhatsApp'),
      description: t('auth.methods.whatsapp.description', 'Sign in with your WhatsApp number'),
      color: 'bg-success hover:bg-successHover text-white',
    },
    LINE: {
      icon: <LineIcon />,
      title: t('auth.methods.line.title', 'LINE'),
      description: t('auth.methods.line.description', 'Sign in with your LINE account'),
      color: 'bg-success hover:bg-successHover text-white',
    },
    OAUTH: {
      icon: <GoogleIcon />,
      title: t('auth.methods.oauth.title', 'OAuth'),
      description: t('auth.methods.oauth.description', 'Sign in with third-party provider'),
      color: 'bg-text hover:bg-textHover text-white',
    },

  };

  return (
    <Card className="border rounded-lg bg-backgroundSecondary">
      <CardBody>
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-semibold mb-2 text-text`}>
            {t('auth.methodSelector.title', 'Choose Sign In Method')}
          </h2>
          <p className={`text-text`}>
            {t('auth.methodSelector.description', 'Select how you would like to sign in')}
          </p>
        </div>

        <div className="space-y-3">
          {availableMethods.map((method) => {
            const config = methodConfig[method];
            return (
              <Button
                key={method}
                onPress={() => onMethodSelect(method)}
                disabled={isLoading}
                size="lg"
                variant="bordered"
                className={`w-full justify-start p-4 h-auto transition-colors duration-200 bg-surface hover:bg-surface text-text`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg text-text ${config.color}`}>{config.icon}</div>
                  <div className="text-left">
                    <div className={`font-medium text-text`}>{config.title}</div>
                    <div className={`text-sm ${'text-textMuted'}`}>{config.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className={`mt-6 text-center text-sm text-textMuted`}>
          <p>{t('auth.methodSelector.security', 'All methods use secure authentication')}</p>
        </div>
      </CardBody>
    </Card>
  );
};
