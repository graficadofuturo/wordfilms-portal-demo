import { renderToString } from 'react-dom/server';
import React from 'react';
import { PricingWizard } from './src/components/PricingWizard';
import { ClientPortal } from './src/components/ClientPortal';

try {
  console.log("Rendering PricingWizard...");
  renderToString(React.createElement(PricingWizard, { onBack: () => {} }));
  console.log("PricingWizard rendered successfully.");
  
  console.log("Rendering ClientPortal...");
  renderToString(React.createElement(ClientPortal, { onBack: () => {} }));
  console.log("ClientPortal rendered successfully.");
} catch (e) {
  console.error("Error rendering:", e);
}
