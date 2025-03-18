import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './SolarPlantFinancialAnalysis.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57'];

const SolarPlantFinancialAnalysis = () => {
  const [viewMode, setViewMode] = useState('comparison');
  const [isLevered, setIsLevered] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [showPieCharts, setShowPieCharts] = useState(false);
  const [expandedChart, setExpandedChart] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Cost breakdown data
  const [initialInvestmentBreakdown, setInitialInvestmentBreakdown] = useState({
    'Solar Panels': 13799986.20,
    'Inverters': 3072000.00,
    'Fence': 120000.00,
    'Grid Connection': 300000.00,
    'Land Lease': 764800.00,
    'Site Preparation': 47800.00,
    'Foundations': 3000000.00,
    'Electrical Equipment': 7000000.00,
    'Monitoring Systems': 150000.00,
    'Engineering': 750000.00,
    'Construction': 1000000.00,
  });

  const [staticConstructionCost, setStaticConstructionCost] = useState(5000000.00);
  const [singleAxisTrackerCost, setSingleAxisTrackerCost] = useState(8000000.00);

  const [staticOpexBreakdown, setStaticOpexBreakdown] = useState({
    'Balancing Fee': 610914.00,
    'Maintenance': 322500.00,
    'Insurance': 129000.00,
    'Monitoring & Performance Analysis': 100000.00,
    'Administrative Expenses': 400000.00,
    'Security': 200000.00,
    'Reserve Funds': 200000.00,
  });

  const [trackerOpexBreakdown, setTrackerOpexBreakdown] = useState({
    'Balancing Fee': 782446.00,
    'Maintenance': 537500.00,
    'Insurance': 129000.00,
    'Monitoring & Performance Analysis': 100000.00,
    'Administrative Expenses': 400000.00,
    'Security': 200000.00,
    'Reserve Funds': 200000.00,
  });

  // State for adjustable parameters
  const [settings, setSettings] = useState({
    // Basic settings
    fixedInitialInvestment: 35004586.20, // Updated with correct total
    trackingInitialInvestment: 38004586.20, // Updated with correct total
    yearlyOpex: viewMode === 'fixed' ? 1962414.00 : 2348946.00,
    electricityPrice2024: 0.07,
    electricityPrice2025: 0.09,
    
    // Advanced settings
    loanPercentage: 0.7,
    loanInterestRate: 0.035,
    inflationRate: 0.04,
    discountRate: 0.06,
    loanTerm: 15,
  });

  // Constants
  const corporateTax = 0.1; // 10%

  // Energy yield data
  const fixedEnergyYield = 174547; // MWh/y
  const trackingEnergyYield = 223556; // MWh/y

  // Panel degradation
  const firstYearDegradation = 0.01; // 1%
  const subsequentYearDegradation = 0.004; // 0.4%

  // Calculate loan amount and yearly payment
  const getLoanAmount = (initialInvestment) => initialInvestment * settings.loanPercentage;
  const getEquityAmount = (initialInvestment) => initialInvestment * (1 - settings.loanPercentage);

  // Calculate yearly loan payment using PMT formula
  const calculatePMT = (rate, nper, pv) => {
    const pvif = Math.pow(1 + rate, nper);
    return (rate * pv * pvif) / (pvif - 1);
  };

  // Handle settings changes
  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: parseFloat(value)
    }));
  };

  // Handle cost breakdown changes
  const handleInitialInvestmentChange = (component, value) => {
    setInitialInvestmentBreakdown(prev => ({
      ...prev,
      [component]: parseFloat(value) || 0
    }));
    
    // Update total initial investment
    const newTotal = Object.values({ ...initialInvestmentBreakdown, [component]: parseFloat(value) || 0 }).reduce((a, b) => a + b, 0);
    if (viewMode === 'fixed') {
      handleSettingChange('fixedInitialInvestment', newTotal + staticConstructionCost);
    } else {
      handleSettingChange('trackingInitialInvestment', newTotal + singleAxisTrackerCost);
    }
  };

  const handleConstructionCostChange = (isStatic, value) => {
    const parsedValue = parseFloat(value) || 0;
    if (isStatic) {
      setStaticConstructionCost(parsedValue);
      const newTotal = Object.values(initialInvestmentBreakdown).reduce((a, b) => a + b, 0) + parsedValue;
      handleSettingChange('fixedInitialInvestment', newTotal);
    } else {
      setSingleAxisTrackerCost(parsedValue);
      const newTotal = Object.values(initialInvestmentBreakdown).reduce((a, b) => a + b, 0) + parsedValue;
      handleSettingChange('trackingInitialInvestment', newTotal);
    }
  };

  const handleOpexChange = (component, value, isStatic) => {
    const parsedValue = parseFloat(value) || 0;
    if (isStatic) {
      setStaticOpexBreakdown(prev => ({
        ...prev,
        [component]: parsedValue
      }));
      const newTotal = Object.values({ ...staticOpexBreakdown, [component]: parsedValue }).reduce((a, b) => a + b, 0);
      if (viewMode === 'fixed') {
        handleSettingChange('yearlyOpex', newTotal);
      }
    } else {
      setTrackerOpexBreakdown(prev => ({
        ...prev,
        [component]: parsedValue
      }));
      const newTotal = Object.values({ ...trackerOpexBreakdown, [component]: parsedValue }).reduce((a, b) => a + b, 0);
      if (viewMode === 'tracking') {
        handleSettingChange('yearlyOpex', newTotal);
      }
    }
  };

  // Function to calculate financial metrics for a given energy yield
  const calculateFinancials = (energyYield, initialInvestment) => {
    const years = Array.from({ length: 25 }, (_, i) => i + 1);
    const loanAmount = getLoanAmount(initialInvestment);
    const equityAmount = getEquityAmount(initialInvestment);
    let remainingLoan = loanAmount;
    const yearlyLoanPayment = calculatePMT(settings.loanInterestRate, settings.loanTerm, loanAmount);

    // Initialize arrays for financial metrics
    const yearlyRevenue = [];
    const yearlyOpexInflated = [];
    const yearlyDepreciation = [];
    const yearlyInterest = [];
    const yearlyPrincipal = [];
    const yearlyTaxableIncome = [];
    const yearlyTax = [];
    const yearlyNetProfit = [];
    const yearlyCashFlow = [];
    const cumulativeCashFlow = [];
    const yearlyDSCR = [];

    // Calculate degradation factors for each year
    const degradationFactors = years.map((year) => {
      if (year === 1) {
        return 1 - firstYearDegradation;
      } else {
        return (1 - firstYearDegradation) * Math.pow(1 - subsequentYearDegradation, year - 1);
      }
    });

    // Calculate electricity price for each year with inflation
    const electricityPrices = years.map((year) => {
      if (year === 1) {
        return settings.electricityPrice2025;
      } else {
        return settings.electricityPrice2025 * Math.pow(1 + settings.inflationRate, year - 1);
      }
    });

    // Calculate OPEX for each year with inflation
    const opexValues = years.map((year) => {
      return settings.yearlyOpex * Math.pow(1 + settings.inflationRate, year - 1);
    });

    // Calculate straight-line depreciation over 25 years
    const yearlyDepreciationValue = initialInvestment / 25;
	
    // Calculate yearly financial metrics
    years.forEach((year, index) => {
      // Revenue
      const revenue = energyYield * 1000 * degradationFactors[index] * electricityPrices[index];
      yearlyRevenue.push(revenue);

      // OPEX with inflation
      yearlyOpexInflated.push(opexValues[index]);

      // Depreciation
      yearlyDepreciation.push(yearlyDepreciationValue);

      // Interest payment (only for levered)
      let interest = 0;
      if (isLevered && year <= settings.loanTerm) {
        interest = remainingLoan * settings.loanInterestRate;
      }
      yearlyInterest.push(interest);

      // Principal payment (only for levered)
      let principal = 0;
      if (isLevered && year <= settings.loanTerm) {
        principal = yearlyLoanPayment - interest;
        remainingLoan -= principal;
      }
      yearlyPrincipal.push(principal);

      // Taxable income
      const taxableIncome = revenue - opexValues[index] - yearlyDepreciationValue - interest;
      yearlyTaxableIncome.push(taxableIncome);

      // Tax
      const tax = Math.max(0, taxableIncome * corporateTax);
      yearlyTax.push(tax);

      // Net profit
      const netProfit = taxableIncome - tax;
      yearlyNetProfit.push(netProfit);

      // Cash flow
      const cashFlow = netProfit + yearlyDepreciationValue - principal;
      yearlyCashFlow.push(cashFlow);

      // Cumulative cash flow (including initial investment)
      if (index === 0) {
        cumulativeCashFlow.push(cashFlow - (isLevered ? equityAmount : initialInvestment));
      } else {
        cumulativeCashFlow.push(cumulativeCashFlow[index - 1] + cashFlow);
      }

      // DSCR (Debt Service Coverage Ratio) - only for levered
      if (isLevered && year <= settings.loanTerm) {
        const dscr = (revenue - opexValues[index] - tax) / yearlyLoanPayment;
        yearlyDSCR.push(dscr);
      } else {
        yearlyDSCR.push(null);
      }
    });

    // Calculate NPV
    const npv = yearlyCashFlow.reduce((acc, cf, idx) => {
      return acc + cf / Math.pow(1 + settings.discountRate, idx + 1);
    }, -(isLevered ? equityAmount : initialInvestment));

    // Calculate payback period
    let paybackPeriod = 0;
    for (let i = 0; i < cumulativeCashFlow.length; i++) {
      if (cumulativeCashFlow[i] >= 0) {
        if (i === 0) {
          paybackPeriod = 1;
        } else {
          const previousCF = i === 0 ? -(isLevered ? equityAmount : initialInvestment) : cumulativeCashFlow[i - 1];
          const currentCF = cumulativeCashFlow[i];
          paybackPeriod = i + Math.abs(previousCF) / (currentCF - previousCF);
        }
        break;
      }
    }
    if (paybackPeriod === 0) {
      paybackPeriod = 25; // No payback within 25 years
    }

    // Calculate ROE (average annual net profit over equity/investment)
    const totalNetProfit = yearlyNetProfit.reduce((sum, profit) => sum + profit, 0);
    const averageAnnualROE = totalNetProfit / 25 / (isLevered ? equityAmount : initialInvestment);

    // Calculate average DSCR (only for levered)
    const averageDSCR = isLevered 
      ? yearlyDSCR.filter((d) => d !== null).reduce((sum, dscr) => sum + dscr, 0) / settings.loanTerm
      : null;

    return {
      npv,
      roe: averageAnnualROE,
      paybackPeriod,
      averageDSCR,
      totalProfit: totalNetProfit,
      yearlyData: years.map((year, i) => ({
        year,
        revenue: yearlyRevenue[i],
        opex: yearlyOpexInflated[i],
        depreciation: yearlyDepreciation[i],
        interest: yearlyInterest[i],
        principal: yearlyPrincipal[i],
        taxableIncome: yearlyTaxableIncome[i],
        tax: yearlyTax[i],
        netProfit: yearlyNetProfit[i],
        cashFlow: yearlyCashFlow[i],
        cumulativeCashFlow: cumulativeCashFlow[i],
        dscr: yearlyDSCR[i],
      })),
    };
  };

  // Calculate financials for both systems
  const fixedSystemFinancials = calculateFinancials(fixedEnergyYield, settings.fixedInitialInvestment);
  const trackingSystemFinancials = calculateFinancials(trackingEnergyYield, settings.trackingInitialInvestment);

  // Prepare data for charts
  const cashFlowChartData = Array.from({ length: 25 }, (_, i) => ({
    year: i + 1,
    fixedCashFlow: fixedSystemFinancials.yearlyData[i].cashFlow,
    trackingCashFlow: trackingSystemFinancials.yearlyData[i].cashFlow,
    fixedCumulativeCF: fixedSystemFinancials.yearlyData[i].cumulativeCashFlow,
    trackingCumulativeCF: trackingSystemFinancials.yearlyData[i].cumulativeCashFlow,
  }));

  const revenueChartData = Array.from({ length: 25 }, (_, i) => ({
    year: i + 1,
    fixedRevenue: fixedSystemFinancials.yearlyData[i].revenue,
    trackingRevenue: trackingSystemFinancials.yearlyData[i].revenue,
    fixedNetProfit: fixedSystemFinancials.yearlyData[i].netProfit,
    trackingNetProfit: trackingSystemFinancials.yearlyData[i].netProfit,
  }));

  const dscrChartData = Array.from({ length: 15 }, (_, i) => ({
    year: i + 1,
    fixedDSCR: fixedSystemFinancials.yearlyData[i].dscr,
    trackingDSCR: trackingSystemFinancials.yearlyData[i].dscr,
  }));

  // Prepare data for pie charts
  const preparePieData = (breakdown) => {
    return Object.entries(breakdown).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getFullInvestmentBreakdown = (isFixed) => {
    return [
      ...Object.entries(initialInvestmentBreakdown).map(([name, value]) => ({
        name,
        value
      })),
      {
        name: isFixed ? 'Static Construction' : 'Single Axis Tracker',
        value: isFixed ? staticConstructionCost : singleAxisTrackerCost
      }
    ];
  };

  // Formatting functions
  const formatNumber = (num) => {
    if (num === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatCurrency = (num) => {
    if (num === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (num) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  // Add new formatting function for chart Y-axis
  const formatChartCurrency = (value) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}K`;
    }
    return `€${value.toFixed(0)}`;
  };

  // Custom label for pie chart that handles small slices better
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, fill }) => {
    const RADIAN = Math.PI / 180;
    const radius = expandedChart === name ? outerRadius * 1.4 : outerRadius * 1.3;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only hide very small slices in normal view
    if (!expandedChart && !isFullScreen && percent < 0.01) return null;

    // Calculate line points
    const innerX = cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN);
    const innerY = cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN);

    // Split long names into multiple lines
    const words = name.split(' ');
    const maxWordsPerLine = 2;
    const lines = [];
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
    }
    lines.push(formatCurrency(value));

    return (
      <g style={{ transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <path
          d={`M ${innerX},${innerY} L ${x},${y}`}
          stroke={fill}
          strokeWidth={1}
          fill="none"
          opacity={0.7}
          style={{ transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        {lines.map((line, i) => (
          <text
            key={i}
            x={x}
            y={y + (i - (lines.length - 1) / 2) * 15}
            fill={fill}
            textAnchor={x > cx ? 'start' : 'end'}
            dominantBaseline="central"
            fontSize={12}
            fontWeight="600"
            style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  // Determine selected system data
  const selectedSystemData = viewMode === 'fixed' ? fixedSystemFinancials : viewMode === 'tracking' ? trackingSystemFinancials : null;

  return (
    <div className={`analysis-container ${showSettings || showCostBreakdown ? 'settings-open' : ''}`}>
      {/* Header and View Mode Buttons */}
      <div className="header-section">
        <h2 className="text-highlight">100MW PV Power Plant Financial Analysis</h2>
        <div className="button-group">
          <button
            className={`btn btn-comparison ${viewMode === 'comparison' ? 'active' : ''}`}
            onClick={() => setViewMode('comparison')}
          >
            Comparison
          </button>
          <button
            className={`btn btn-fixed ${viewMode === 'fixed' ? 'active' : ''}`}
            onClick={() => setViewMode('fixed')}
          >
            Fixed System
          </button>
          <button
            className={`btn btn-tracking ${viewMode === 'tracking' ? 'active' : ''}`}
            onClick={() => setViewMode('tracking')}
          >
            Tracking System
          </button>
          <button
            className={`btn ${isLevered ? 'btn-levered' : 'btn-unlevered'}`}
            onClick={() => setIsLevered(!isLevered)}
          >
            {isLevered ? 'Levered' : 'Unlevered'}
          </button>
        </div>
      </div>

      {/* Control Buttons Container */}
      <div className="control-buttons-container">
        <button 
          className="settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? '⚙️' : '⚙️'} Settings
        </button>
        <button 
          className="cost-breakdown-toggle"
          onClick={() => setShowCostBreakdown(!showCostBreakdown)}
        >
          {showCostBreakdown ? '💰' : '💰'} Costs
        </button>
        <button 
          className="pie-charts-toggle"
          onClick={() => setShowPieCharts(!showPieCharts)}
        >
          {showPieCharts ? '📊' : '📊'} Charts
        </button>
      </div>

      {/* Settings Panel */}
      <div className={`settings-panel ${showSettings ? 'show' : ''}`}>
        <div className="panel-header">
          <h3>Settings</h3>
          <button 
            className="close-panel-button"
            onClick={() => setShowSettings(false)}
          >
            ×
          </button>
        </div>
        <div className="settings-content">
          <h3>Basic Settings</h3>
          <div className="settings-group">
            <label>
              Fixed System Investment (€)
              <input
                type="number"
                value={settings.fixedInitialInvestment}
                onChange={(e) => handleSettingChange('fixedInitialInvestment', e.target.value)}
              />
            </label>
            <label>
              Tracking System Investment (€)
              <input
                type="number"
                value={settings.trackingInitialInvestment}
                onChange={(e) => handleSettingChange('trackingInitialInvestment', e.target.value)}
              />
            </label>
            <label>
              Yearly OPEX (€)
              <input
                type="number"
                value={settings.yearlyOpex}
                onChange={(e) => handleSettingChange('yearlyOpex', e.target.value)}
              />
            </label>
            <label>
              Electricity Price 2024 (€/kWh)
              <input
                type="number"
                step="0.01"
                value={settings.electricityPrice2024}
                onChange={(e) => handleSettingChange('electricityPrice2024', e.target.value)}
              />
            </label>
            <label>
              Electricity Price 2025 (€/kWh)
              <input
                type="number"
                step="0.01"
                value={settings.electricityPrice2025}
                onChange={(e) => handleSettingChange('electricityPrice2025', e.target.value)}
              />
            </label>
          </div>

          <button 
            className="advanced-settings-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
          </button>

          {showAdvanced && (
            <div className="settings-group">
              <h3>Advanced Settings</h3>
              <label>
                Loan Percentage (%)
                <input
                  type="number"
                  step="0.01"
                  value={settings.loanPercentage * 100}
                  onChange={(e) => handleSettingChange('loanPercentage', e.target.value / 100)}
                />
              </label>
              <label>
                Loan Interest Rate (%)
                <input
                  type="number"
                  step="0.01"
                  value={settings.loanInterestRate * 100}
                  onChange={(e) => handleSettingChange('loanInterestRate', e.target.value / 100)}
                />
              </label>
              <label>
                Inflation Rate (%)
                <input
                  type="number"
                  step="0.01"
                  value={settings.inflationRate * 100}
                  onChange={(e) => handleSettingChange('inflationRate', e.target.value / 100)}
                />
              </label>
              <label>
                Discount Rate (%)
                <input
                  type="number"
                  step="0.01"
                  value={settings.discountRate * 100}
                  onChange={(e) => handleSettingChange('discountRate', e.target.value / 100)}
                />
              </label>
              <label>
                Loan Term (years)
                <input
                  type="number"
                  value={settings.loanTerm}
                  onChange={(e) => handleSettingChange('loanTerm', e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Cost Breakdown Panel */}
      <div className={`cost-breakdown-panel ${showCostBreakdown ? 'show' : ''}`}>
        <div className="panel-header">
          <h3>Cost Breakdown</h3>
          <button 
            className="close-panel-button"
            onClick={() => setShowCostBreakdown(false)}
          >
            ×
          </button>
        </div>
        <div className="cost-breakdown-content">
          <h3>Cost Breakdown</h3>
          <div className="cost-breakdown-group">
            <h4>Initial Investment Components</h4>
            {Object.entries(initialInvestmentBreakdown).map(([name, value]) => (
              <div key={name} className="cost-item">
                <span>{name}</span>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleInitialInvestmentChange(name, e.target.value)}
                  className="cost-input"
                />
              </div>
            ))}
            <div className="cost-item">
              <span>{viewMode === 'fixed' ? 'Static Construction' : 'Single Axis Tracker'}</span>
              <input
                type="number"
                value={viewMode === 'fixed' ? staticConstructionCost : singleAxisTrackerCost}
                onChange={(e) => handleConstructionCostChange(viewMode === 'fixed', e.target.value)}
                className="cost-input"
              />
            </div>
          </div>

          <div className="cost-breakdown-group">
            <h4>OPEX Components</h4>
            {Object.entries(viewMode === 'fixed' ? staticOpexBreakdown : trackerOpexBreakdown).map(([name, value]) => (
              <div key={name} className="cost-item">
                <span>{name}</span>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleOpexChange(name, e.target.value, viewMode === 'fixed')}
                  className="cost-input"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pie Charts Section */}
      {showPieCharts && (
        <div className={`pie-charts-container ${isFullScreen ? 'expanded-view' : ''}`}>
          <div className="pie-charts-header">
            <h3 className="text-highlight">Cost Breakdown Charts</h3>
            {isFullScreen && (
              <button 
                className="close-panel-button"
                onClick={() => setShowPieCharts(false)}
              >
                ×
              </button>
            )}
            <button 
              className="expand-charts-button"
              onClick={() => setIsFullScreen(!isFullScreen)}
            />
          </div>
          <div className={`pie-chart-wrapper ${expandedChart === 'investment' ? 'expanded' : ''}`}>
            <h3 className="text-highlight">Initial Investment Breakdown</h3>
            <div 
              onClick={() => setExpandedChart(expandedChart === 'investment' ? null : 'investment')}
              className="pie-chart-clickable"
            >
              <ResponsiveContainer width="100%" height={isFullScreen ? 600 : 400}>
                <PieChart>
                  <Pie
                    data={getFullInvestmentBreakdown(viewMode === 'fixed')}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={expandedChart === 'investment' || isFullScreen ? 80 : 60}
                    outerRadius={expandedChart === 'investment' || isFullScreen ? 200 : 140}
                    label={renderCustomLabel}
                    labelLine={false}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={expandedChart === 'investment' || isFullScreen ? 3 : 1}
                  >
                    {getFullInvestmentBreakdown(viewMode === 'fixed').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {(viewMode === 'comparison' || viewMode === 'fixed') && (
            <div className={`pie-chart-wrapper ${expandedChart === 'static-opex' ? 'expanded' : ''}`}>
              <h3 className="text-highlight">Static System OPEX Breakdown</h3>
              <div 
                onClick={() => setExpandedChart(expandedChart === 'static-opex' ? null : 'static-opex')}
                className="pie-chart-clickable"
              >
                <ResponsiveContainer width="100%" height={isFullScreen ? 600 : 400}>
                  <PieChart>
                    <Pie
                      data={preparePieData(staticOpexBreakdown)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={expandedChart === 'static-opex' || isFullScreen ? 80 : 60}
                      outerRadius={expandedChart === 'static-opex' || isFullScreen ? 200 : 140}
                      label={renderCustomLabel}
                      labelLine={false}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={expandedChart === 'static-opex' || isFullScreen ? 3 : 1}
                    >
                      {preparePieData(staticOpexBreakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {(viewMode === 'comparison' || viewMode === 'tracking') && (
            <div className={`pie-chart-wrapper ${expandedChart === 'tracking-opex' ? 'expanded' : ''}`}>
              <h3 className="text-highlight">Tracking System OPEX Breakdown</h3>
              <div 
                onClick={() => setExpandedChart(expandedChart === 'tracking-opex' ? null : 'tracking-opex')}
                className="pie-chart-clickable"
              >
                <ResponsiveContainer width="100%" height={isFullScreen ? 600 : 400}>
                  <PieChart>
                    <Pie
                      data={preparePieData(trackerOpexBreakdown)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={expandedChart === 'tracking-opex' || isFullScreen ? 80 : 60}
                      outerRadius={expandedChart === 'tracking-opex' || isFullScreen ? 200 : 140}
                      label={renderCustomLabel}
                      labelLine={false}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={expandedChart === 'tracking-opex' || isFullScreen ? 3 : 1}
                    >
                      {preparePieData(trackerOpexBreakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Financial Metrics Table */}
      <div className="chart-wrapper">
        <h3 className="text-highlight">Key Financial Metrics</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Metric</th>
              {viewMode === 'comparison' ? (
                <>
                  <th>Fixed System</th>
                  <th>Tracking System</th>
                  <th>Difference</th>
                </>
              ) : (
                <th>{viewMode === 'fixed' ? 'Fixed System' : 'Tracking System'}</th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Initial Investment</td>
              {viewMode === 'comparison' ? (
                <>
                  <td data-label="Fixed System" className="metric-value">{formatCurrency(settings.fixedInitialInvestment)}</td>
                  <td data-label="Tracking System" className="metric-value">{formatCurrency(settings.trackingInitialInvestment)}</td>
                  <td data-label="Difference" className="metric-value">{formatCurrency(settings.trackingInitialInvestment - settings.fixedInitialInvestment)}</td>
                </>
              ) : (
                <td data-label={viewMode === 'fixed' ? 'Fixed System' : 'Tracking System'} className="metric-value">
                  {formatCurrency(viewMode === 'fixed' ? settings.fixedInitialInvestment : settings.trackingInitialInvestment)}
                </td>
              )}
            </tr>
            <tr>
              <td>NPV ({isLevered ? 'Levered' : 'Unlevered'})</td>
              {viewMode === 'comparison' ? (
                <>
                  <td data-label="Fixed System" className="metric-value">{formatCurrency(fixedSystemFinancials.npv)}</td>
                  <td data-label="Tracking System" className="metric-value">{formatCurrency(trackingSystemFinancials.npv)}</td>
                  <td data-label="Difference" className="metric-value">{formatCurrency(trackingSystemFinancials.npv - fixedSystemFinancials.npv)}</td>
                </>
              ) : (
                <td data-label={viewMode === 'fixed' ? 'Fixed System' : 'Tracking System'} className="metric-value">
                  {formatCurrency(selectedSystemData.npv)}
                </td>
              )}
            </tr>
            <tr>
              <td>ROE ({isLevered ? 'Levered' : 'Unlevered'})</td>
              {viewMode === 'comparison' ? (
                <>
                  <td data-label="Fixed System" className="metric-value">{formatPercentage(fixedSystemFinancials.roe)}</td>
                  <td data-label="Tracking System" className="metric-value">{formatPercentage(trackingSystemFinancials.roe)}</td>
                  <td data-label="Difference" className="metric-value">{formatPercentage(trackingSystemFinancials.roe - fixedSystemFinancials.roe)}</td>
                </>
              ) : (
                <td data-label={viewMode === 'fixed' ? 'Fixed System' : 'Tracking System'} className="metric-value">
                  {formatPercentage(selectedSystemData.roe)}
                </td>
              )}
            </tr>
            <tr>
              <td>Payback Period ({isLevered ? 'Levered' : 'Unlevered'})</td>
              {viewMode === 'comparison' ? (
                <>
                  <td data-label="Fixed System" className="metric-value">{formatNumber(fixedSystemFinancials.paybackPeriod)}</td>
                  <td data-label="Tracking System" className="metric-value">{formatNumber(trackingSystemFinancials.paybackPeriod)}</td>
                  <td data-label="Difference" className="metric-value">{formatNumber(trackingSystemFinancials.paybackPeriod - fixedSystemFinancials.paybackPeriod)}</td>
                </>
              ) : (
                <td data-label={viewMode === 'fixed' ? 'Fixed System' : 'Tracking System'} className="metric-value">
                  {formatNumber(selectedSystemData.paybackPeriod)}
                </td>
              )}
            </tr>
            {isLevered && (
              <tr>
                <td>Average DSCR</td>
                {viewMode === 'comparison' ? (
                  <>
                    <td data-label="Fixed System" className="metric-value">{formatNumber(fixedSystemFinancials.averageDSCR)}</td>
                    <td data-label="Tracking System" className="metric-value">{formatNumber(trackingSystemFinancials.averageDSCR)}</td>
                    <td data-label="Difference" className="metric-value">{formatNumber(trackingSystemFinancials.averageDSCR - fixedSystemFinancials.averageDSCR)}</td>
                  </>
                ) : (
                  <td data-label={viewMode === 'fixed' ? 'Fixed System' : 'Tracking System'} className="metric-value">
                    {formatNumber(selectedSystemData.averageDSCR)}
                  </td>
                )}
              </tr>
            )}
            <tr>
              <td>Total Profit (25 years)</td>
              {viewMode === 'comparison' ? (
                <>
                  <td data-label="Fixed System" className="metric-value">{formatCurrency(fixedSystemFinancials.totalProfit)}</td>
                  <td data-label="Tracking System" className="metric-value">{formatCurrency(trackingSystemFinancials.totalProfit)}</td>
                  <td data-label="Difference" className="metric-value">{formatCurrency(trackingSystemFinancials.totalProfit - fixedSystemFinancials.totalProfit)}</td>
                </>
              ) : (
                <td data-label={viewMode === 'fixed' ? 'Fixed System' : 'Tracking System'} className="metric-value">
                  {formatCurrency(selectedSystemData.totalProfit)}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div>
        {/* Cash Flow Chart */}
        <div className="chart-wrapper">
          <h3 className="text-highlight">Cash Flow Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={formatChartCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              {viewMode === 'comparison' || viewMode === 'fixed' ? (
                <Line type="monotone" dataKey="fixedCashFlow" stroke="#8884d8" name="Fixed System Cash Flow" />
              ) : null}
              {viewMode === 'comparison' || viewMode === 'tracking' ? (
                <Line type="monotone" dataKey="trackingCashFlow" stroke="#82ca9d" name="Tracking System Cash Flow" />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative Cash Flow Chart */}
        <div className="chart-wrapper">
          <h3 className="text-highlight">Cumulative Cash Flow</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={formatChartCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              {viewMode === 'comparison' || viewMode === 'fixed' ? (
                <Line type="monotone" dataKey="fixedCumulativeCF" stroke="#8884d8" name="Fixed System Cumulative CF" />
              ) : null}
              {viewMode === 'comparison' || viewMode === 'tracking' ? (
                <Line type="monotone" dataKey="trackingCumulativeCF" stroke="#82ca9d" name="Tracking System Cumulative CF" />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue and Net Profit Chart */}
        <div className="chart-wrapper">
          <h3 className="text-highlight">Revenue and Net Profit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={formatChartCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="fixedRevenue" fill="#8884d8" name="Fixed System Revenue" />
              <Bar dataKey="fixedNetProfit" fill="#82ca9d" name="Fixed System Net Profit" />
              <Bar dataKey="trackingRevenue" fill="#ffc658" name="Tracking System Revenue" />
              <Bar dataKey="trackingNetProfit" fill="#ff7300" name="Tracking System Net Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DSCR Chart */}
        <div className="chart-wrapper">
          <h3 className="text-highlight">Debt Service Coverage Ratio (DSCR)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dscrChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {viewMode === 'comparison' || viewMode === 'fixed' ? (
                <Line type="monotone" dataKey="fixedDSCR" stroke="#8884d8" name="Fixed System DSCR" />
              ) : null}
              {viewMode === 'comparison' || viewMode === 'tracking' ? (
                <Line type="monotone" dataKey="trackingDSCR" stroke="#82ca9d" name="Tracking System DSCR" />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Yearly Data Table (shown only in fixed or tracking mode) */}
      {viewMode !== 'comparison' && (
        <div className="chart-wrapper">
          <h3 className="text-highlight">
            Yearly Financial Data - {viewMode === 'fixed' ? 'Fixed System' : 'Tracking System'}
          </h3>
          <div className="responsive-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Revenue</th>
                  <th>OPEX</th>
                  <th>Depreciation</th>
                  <th>Interest</th>
                  <th>Principal</th>
                  <th>Taxable Income</th>
                  <th>Tax</th>
                  <th>Net Profit</th>
                  <th>Cash Flow</th>
                  <th>Cumulative CF</th>
                  <th>DSCR</th>
                </tr>
              </thead>
              <tbody>
                {selectedSystemData.yearlyData.map((data, index) => (
                  <tr key={index}>
                    <td>{data.year}</td>
                    <td className="metric-value">{formatCurrency(data.revenue)}</td>
                    <td className="metric-value">{formatCurrency(data.opex)}</td>
                    <td className="metric-value">{formatCurrency(data.depreciation)}</td>
                    <td className="metric-value">{formatCurrency(data.interest)}</td>
                    <td className="metric-value">{formatCurrency(data.principal)}</td>
                    <td className="metric-value">{formatCurrency(data.taxableIncome)}</td>
                    <td className="metric-value">{formatCurrency(data.tax)}</td>
                    <td className="metric-value">{formatCurrency(data.netProfit)}</td>
                    <td className="metric-value">{formatCurrency(data.cashFlow)}</td>
                    <td className="metric-value">{formatCurrency(data.cumulativeCashFlow)}</td>
                    <td className="metric-value">{data.dscr ? formatNumber(data.dscr) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
    return (
      <div className="App">
        <SolarPlantFinancialAnalysis />
      </div>
    );
  }
  
  export default App;
