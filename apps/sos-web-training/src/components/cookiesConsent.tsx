'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { savePreferences, loadPreferences } from '@/app/actions/cookie.actions';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from '@/hooks/api/useTranslation';

export type CookieConsentOptions = {
  analytics: boolean;
  marketing: boolean;
};

export default function CookieConsent() {
  const { t } = useTranslation('cookie');
  const [isBannerVisible, setBannerVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const checkPreferences = async () => {
      const prefs = await loadPreferences();
      setBannerVisible(!prefs);
    };
    checkPreferences();
  }, []);

  const updateCookiePreferences = async ({ analytics, marketing }: CookieConsentOptions) => {
    try {
      await savePreferences({ analytics, marketing });
      setBannerVisible(false);
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save cookie preferences:', error);
    }
  };

  const handleSavePreferences = () =>
    updateCookiePreferences({
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
    });

  return (
    <>
      {isBannerVisible && (
        <div className="fixed sm:bottom-5 sm:left-5 sm:right-5 sm:max-w-md w-full bg-background p-5 text-center max-h-[400px] z-30 overflow-y-auto rounded-lg shadow-lg border border-solid border-default bottom-4 left-4 right-4 max-w-fit">
          <div className="mb-4">
            <h4 className="text-2xl font-semibold mb-1">{t('privacyTitle')}</h4>
            <p className="text-base">{t('privacyDescription')}</p>
          </div>
          <div className="flex flex-col sm:gap-2 gap-4 sm:mt-2 mt-0 items-center">
            <Button
              className="bg-secondary border border-border font-semibold text-white w-3/4 px-4 py-2 rounded-lg"
              onPress={() => setModalVisible(true)}
            >
              {t('customize')}
            </Button>
            <Button
              className="bg-info border border-border font-semibold text-white w-3/4 px-4 py-2 rounded-lg"
              onPress={() => updateCookiePreferences({ analytics: false, marketing: false })}
            >
              {t('acceptOnlyNecessary')}
            </Button>
            <Button
              className="bg-primary dark:border-2 font-semibold text-white w-3/4 px-4 py-2 rounded-lg"
              onPress={() => updateCookiePreferences({ analytics: true, marketing: true })}
            >
              {t('acceptAll')}
            </Button>
          </div>
        </div>
      )}

      {isModalVisible && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setModalVisible(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-5">
            <div className="bg-content1 w-full max-w-lg p-5 rounded-lg shadow-lg overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b pb-4 mb-4 gap-2">
                <h4 className="text-2xl font-bold">{t('customizeTitle')}</h4>
                <Button
                  isIconOnly
                  size="sm"
                  color="secondary"
                  onPress={() => setModalVisible(false)}
                >
                  <FaTimes />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-xl font-semibold">{t('basicCookiesTitle')}</h5>
                  <p className="text-base mb-2">{t('basicCookiesDescription')}</p>
                  <label className="inline-flex items-center cursor-not-allowed">
                    <input className="form-checkbox" type="checkbox" checked disabled />
                    <span className="ml-2">{t('alwaysActive')}</span>
                  </label>
                </div>
                <div>
                  <h5 className="text-xl font-semibold">{t('analyticsCookiesTitle')}</h5>
                  <p className="text-base mb-2">{t('analyticsCookiesDescription')}</p>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="form-checkbox"
                    />
                    <span className="ml-2">{t('enableAnalytics')}</span>
                  </label>
                </div>
                <div>
                  <h5 className="text-xl font-semibold">{t('marketingCookiesTitle')}</h5>
                  <p className="text-base mb-2">{t('marketingCookiesDescription')}</p>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={marketingEnabled}
                      onChange={(e) => setMarketingEnabled(e.target.checked)}
                      className="form-checkbox"
                    />
                    <span className="ml-2">{t('enableMarketing')}</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:gap-2 gap-4 mt-4 items-center">
                <Button
                  className="bg-secondary font-semibold text-white w-3/4 px-4 py-2 rounded-lg"
                  onPress={handleSavePreferences}
                >
                  {t('savePreferences')}
                </Button>
                <Button
                  className="bg-info font-semibold text-foreground-50 w-3/4 px-4 py-2 rounded-lg"
                  onPress={() => updateCookiePreferences({ analytics: false, marketing: false })}
                >
                  {t('acceptOnlyNecessary')}
                </Button>
                <Button
                  className="bg-primary font-semibold text-white w-3/4 px-4 py-2 rounded-lg"
                  onPress={() => updateCookiePreferences({ analytics: true, marketing: true })}
                >
                  {t('acceptAll')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
