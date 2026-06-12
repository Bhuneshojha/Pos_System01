import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Card, Typography, Tab, Tabs, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress
} from '@mui/material';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, 
  XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer
} from 'recharts';
import { 
  FaWallet, FaBoxes, FaPercent, FaUsers, FaClock, FaUserShield, FaHistory, FaStore
} from 'react-icons/fa';

const THEME = {
  bgMain: '#070a0e',
  bgCard: '#12161f',
  borderColor: '#1e2530',
  borderHover: '#58a6ff',
  textMuted: '#7d8590',
  accentGreen: '#3fb950',
  accentBlue: '#58a6ff',
  accentOrange: '#f0883e',
  accentPurple: '#bc8cff',
  accentCyan: '#39c5cf',
};

const CHART_COLORS = [THEME.accentBlue, THEME.accentGreen, THEME.accentPurple, THEME.accentOrange];

// Change this to match your backend base URL
// Set this to your live backend Codespace URL
const API_BASE_URL = 'https://cuddly-telegram-v6rqjx79xgvfwvx-5000.app.github.dev/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeStore] = useState({ id: 1, name: "Arbex Retail Control Node" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Real State Managed Data ---
  const [kpiCards, setKpiCards] = useState({ total_sales: 'PKR 0', inventory_val: 'PKR 0', total_tax: 'PKR 0', staff_count: '0' });
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [categoryShare, setCategoryShare] = useState([]);
  const [hourlyTraffic, setHourlyTraffic] = useState([]);
  const [monthlyTargets, setMonthlyTargets] = useState([]);
  
  const [salesLog, setSalesLog] = useState([]);
  const [staffLog, setStaffLog] = useState([]);
  const [operationalLog, setOperationalLog] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Replace with your real endpoint route layout (e.g., /dashboard?storeId=1)
        const response = await fetch(`${API_BASE_URL}/dashboard?storeId=${activeStore.id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP network error: ${response.status}`);
        }

        const data = await response.json();

        // --- Mapping API Responses directly to hooks ---
        setKpiCards({
          total_sales: data.kpiCards?.total_sales || 'PKR 0',
          inventory_val: data.kpiCards?.inventory_val || 'PKR 0',
          total_tax: data.kpiCards?.total_tax || 'PKR 0',
          staff_count: data.kpiCards?.staff_count || '0'
        });
        setRevenueTrend(data.revenueTrend || []);
        setCategoryShare(data.categoryShare || []);
        setHourlyTraffic(data.hourlyTraffic || []);
        setMonthlyTargets(data.monthlyTargets || []);
        setSalesLog(data.salesLog || []);
        setStaffLog(data.staffLog || []);
        setOperationalLog(data.operationalLog || []);
        
        setError(null);
      } catch (err) {
        console.error("Dashboard fetching failure:", err);
        setError("Failed to stream live system data metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeStore.id]);

  // TAB 0: EXECUTIVE OVERVIEW
  const renderOverviewTab = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Gross Turnover', value: kpiCards.total_sales, sub: 'sales.total_amount', color: THEME.accentGreen, icon: <FaWallet /> },
          { title: 'Procurement', value: kpiCards.inventory_val, sub: 'inventory.quantity_on_hand', color: THEME.accentBlue, icon: <FaBoxes /> },
          { title: 'Tax Liability', value: kpiCards.total_tax, sub: 'sales.tax_amount', color: THEME.accentCyan, icon: <FaPercent /> },
          { title: 'Active Nodes', value: kpiCards.staff_count, sub: 'users.is_active', color: THEME.accentOrange, icon: <FaUsers /> }
        ].map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ bgcolor: THEME.bgCard, border: `1px solid ${THEME.borderColor}`, borderRadius: '16px', p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: THEME.textMuted, fontWeight: 600 }}>{card.title}</Typography>
                <Box sx={{ color: card.color, bgcolor: `${card.color}15`, p: 1, borderRadius: '10px', display: 'flex' }}>{card.icon}</Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', my: 0.5 }}>{card.value}</Typography>
              <Typography variant="caption" sx={{ color: THEME.textMuted, display: 'block', fontSize: '10px' }}>{card.sub}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ bgcolor: THEME.bgCard, border: `1px solid ${THEME.borderColor}`, borderRadius: '16px', p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 2, fontWeight: 700 }}>Sales Performance (Historical Volume)</Typography>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <XAxis dataKey="date" stroke={THEME.textMuted} fontSize={11} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} tickLine={false} />
                  <ChartTooltip contentStyle={{ backgroundColor: THEME.bgCard, borderColor: THEME.borderColor, color: '#fff' }} />
                  <Area type="monotone" dataKey="Sales" stroke={THEME.accentBlue} strokeWidth={3} fill="rgba(88,166,255,0.1)" name="Revenue Flow" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: THEME.bgCard, border: `1px solid ${THEME.borderColor}`, borderRadius: '16px', p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 2, fontWeight: 700 }}>Category Share Breakdown</Typography>
            <Box sx={{ width: '100%', height: 200, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryShare} cx="50%" cy="50%" innerRadius={60} outerRadius={75} paddingAngle={5} dataKey="value">
                    {categoryShare.map((entry, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2, flexWrap: 'wrap', gap: 1 }}>
              {categoryShare.map((c, i) => (
                <Typography key={i} variant="caption" sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} /> {c.name} ({c.value}%)
                </Typography>
              ))}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: THEME.bgCard, border: `1px solid ${THEME.borderColor}`, borderRadius: '16px', p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 2, fontWeight: 700 }}>Real-time Throughput (Hourly Operations)</Typography>
            <Box sx={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTraffic}>
                  <XAxis dataKey="hour" stroke={THEME.textMuted} fontSize={11} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} tickLine={false} />
                  <ChartTooltip contentStyle={{ backgroundColor: THEME.bgCard, borderColor: THEME.borderColor }} />
                  <Bar dataKey="Orders" fill={THEME.accentOrange} radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: THEME.bgCard, border: `1px solid ${THEME.borderColor}`, borderRadius: '16px', p: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 2, fontWeight: 700 }}>Weekly Target Run-Rates (%)</Typography>
            <Box sx={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTargets}>
                  <XAxis dataKey="month" stroke={THEME.textMuted} fontSize={11} tickLine={false} />
                  <YAxis stroke={THEME.textMuted} fontSize={11} tickLine={false} />
                  <ChartTooltip contentStyle={{ backgroundColor: THEME.bgCard, borderColor: THEME.borderColor }} />
                  <Line type="monotone" dataKey="TargetReached" stroke={THEME.accentCyan} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // TAB 1: ORDERS & SALES LOG
  const renderOrdersLogTab = () => (
    <Card sx={{ bgcolor: THEME.bgCard, border: `1px solid ${THEME.borderColor}`, borderRadius: '16px', overflow: 'hidden' }}>
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>Transactional Ledger Pipeline</Typography>
        <Chip label="Live Schema Pull" size="small" sx={{ bgcolor: `${THEME.accentGreen}20`, color: THEME.accentGreen, fontWeight: 600 }} />
      </Box>
      <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#161b22' }}>
            <TableRow>
              <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}`, fontWeight: 700 }}>Invoice Number</TableCell>
              <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}`, fontWeight: 700 }}>Timestamp</TableCell>
              <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}`, fontWeight: 700 }}>Gross Total</TableCell>
              <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}`, fontWeight: 700 }}>Tax Component</TableCell>
              <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}`, fontWeight: 700 }}>Gateway</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salesLog.map((row, i) => (
              <TableRow key={i}>
                <TableCell sx={{ color: THEME.accentBlue, fontWeight: 600, borderBottom: `1px solid ${THEME.borderColor}` }}>{row.id}</TableCell>
                <TableCell sx={{ color: '#fff', borderBottom: `1px solid ${THEME.borderColor}` }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FaClock size={11} color={THEME.textMuted}/>{row.time}</Box></TableCell>
                <TableCell sx={{ color: THEME.accentGreen, fontWeight: 700, borderBottom: `1px solid ${THEME.borderColor}` }}>{row.total}</TableCell>
                <TableCell sx={{ color: '#fff', borderBottom: `1px solid ${THEME.borderColor}` }}>{row.tax}</TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${THEME.borderColor}` }}><Chip label={row.method} size="small" sx={{ bgcolor: '#21262d', color: '#fff' }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  // TAB 2: STAFF AUTHORIZATIONS
  const renderStaffTab = () => (
    <Card sx={{ bgcolor: THEME.bgCard, border: `1px solid ${THEME.borderColor}`, borderRadius: '16px', overflow: 'hidden' }}>
      <Box sx={{ p: 3 }}><Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>Operator Access Security Nodes</Typography></Box>
      <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#161b22' }}>
            <TableRow>
              <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}`, fontWeight: 700 }}>Operator Identity</TableCell>
              <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}`, fontWeight: 700 }}>Assigned Role</TableCell>
              <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}`, fontWeight: 700 }}>Communication Endpoint</TableCell>
              <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}`, fontWeight: 700 }}>State</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staffLog.map((staff, i) => (
              <TableRow key={i}>
                <TableCell sx={{ color: '#fff', fontWeight: 600, borderBottom: `1px solid ${THEME.borderColor}` }}>{staff.name}</TableCell>
                <TableCell sx={{ color: THEME.accentPurple, fontWeight: 600, borderBottom: `1px solid ${THEME.borderColor}` }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FaUserShield /> {staff.role}</Box></TableCell>
                <TableCell sx={{ color: THEME.textMuted, borderBottom: `1px solid ${THEME.borderColor}` }}>{staff.email}</TableCell>
                <TableCell sx={{ borderBottom: `1px solid ${THEME.borderColor}` }}>
                  <Chip 
                    label={staff.status} size="small" 
                    sx={{ bgcolor: staff.status === 'Active' ? `${THEME.accentGreen}15` : 'rgba(240,136,62,0.15)', color: staff.status === 'Active' ? THEME.accentGreen : THEME.accentOrange }} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  // TAB 3: OPERATIONAL STREAMS
  const renderOperationalTab = () => (
    <Card sx={{ bgcolor: THEME.bgCard, border: `1px solid ${THEME.borderColor}`, borderRadius: '16px', p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff', mb: 3 }}>Live Inventory & Stream Event Mutations</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {operationalLog.map((log, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#161b22', borderRadius: '12px', borderLeft: `4px solid ${log.type === 'IN' ? THEME.accentGreen : THEME.accentBlue}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ color: THEME.textMuted }}><FaHistory size={14}/></Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>{log.event}</Typography>
                <Typography variant="caption" sx={{ color: THEME.textMuted }}>Origin Subsystem: <b>{log.module}</b></Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: THEME.textMuted, fontFamily: 'monospace' }}>{log.timestamp}</Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, bgcolor: THEME.bgMain, minHeight: '100vh', color: '#f0f6fc', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, pb: 2, borderBottom: `1px solid ${THEME.borderColor}` }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Internal Admin Control Console</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, color: THEME.accentBlue }}>
            <FaStore size={12} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Active Target Tenant: {activeStore.name}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs Selector */}
      <Tabs 
        value={activeTab} 
        onChange={(e, v) => setActiveTab(v)} 
        sx={{ 
          mb: 4, borderBottom: `1px solid ${THEME.borderColor}`,
          '& .MuiTabs-indicator': { bgcolor: THEME.accentBlue, height: '3px', borderRadius: '4px' },
          '& .MuiTab-root': { color: THEME.textMuted, fontWeight: 700, textTransform: 'none', fontSize: '14px', px: 3, '&.Mui-selected': { color: THEME.accentBlue } }
        }}
      >
        <Tab label="Executive Overview" />
        <Tab label="Orders & Sales Log" />
        <Tab label="Staff Authorizations" />
        <Tab label="Operational Streams" />
      </Tabs>

      {/* Loading & Error Indicators */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: THEME.accentBlue }} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, bgcolor: 'rgba(240,136,62,0.15)', borderRadius: '12px', border: `1px solid ${THEME.accentOrange}` }}>
          <Typography sx={{ color: THEME.accentOrange, fontWeight: 600 }}>{error}</Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderOrdersLogTab()}
          {activeTab === 2 && renderStaffTab()}
          {activeTab === 3 && renderOperationalTab()}
        </Box>
      )}
    </Box>
  );
}