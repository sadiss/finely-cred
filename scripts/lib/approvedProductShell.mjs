import fs from 'node:fs';
import path from 'node:path';

export function loadAppSrc(root) {
  return fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
}

export function componentNameFromPageFile(rel) {
  return path.basename(rel, path.extname(rel));
}

export function isProductRoutedLegacy(appSrc, componentName) {
  return appSrc.includes(`legacy={<${componentName}`);
}

export function hasApprovedPublicShell(src) {
  return (
    src.includes('FinelyUnifiedHubLayout') ||
    src.includes('PersonalCreditHeroShell') ||
    src.includes('PricingPackageCatalog') ||
    src.includes('FinelyOsPageFooter') ||
    (src.includes('PageShell') &&
      (src.includes('finelyOsCatalogCard') ||
        src.includes('FINELY_OS_PAGE') ||
        src.includes('LandingSellAtmosphere') ||
        src.includes('LandingTypewriterTitle')))
  );
}

export function hasApprovedPortalOrAdminShell(src, appSrc, componentName) {
  return (
    src.includes('FinelyUnifiedHubLayout') ||
    src.includes('ProductHubScaffold') ||
    src.includes('ProductWorkspaceShell') ||
    src.includes('ProductPageLayout') ||
    isProductRoutedLegacy(appSrc, componentName)
  );
}

export function hasApprovedLightChrome(src) {
  return (
    src.includes('border-white/[0.08]') ||
    src.includes('fc-light-glass-panel') ||
    src.includes('fc-light-chrome-panel') ||
    src.includes('fc-light-chrome-strip') ||
    src.includes('finelyOsCatalogCard') ||
    src.includes('FINELY_OS_GLASS_INNER') ||
    src.includes('FINELY_OS_ENTITY_PANEL_INNER') ||
    src.includes('FINELY_OS_ENTITY_PANEL') ||
    src.includes('ProductHubScaffold') ||
    src.includes('fc-wlp-') ||
    src.includes('FINELY_OS_PAGE')
  );
}
