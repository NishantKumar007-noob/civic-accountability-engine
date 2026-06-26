import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MapPin,
  AlertTriangle,
  Droplets,
  Timer,
  Car,
  X,
  Share2,
  Building2,
  Clock,
  Loader2,
  Filter,
  ChevronDown,
  Check,
  Sparkles
} from 'lucide-react';
import { generateEscalationContent, isGeminiConfigured, type EscalationContent } from './lib/gemini';

interface Issue {
  id: string;
  title: string;
  location: string;
  assignedTo: string;
  slaHours: number;
  type: 'pothole' | 'water-leak';
  isSimulated?: boolean;
  isEscalated?: boolean;
  latitude: number;
  longitude: number;
}

type FilterType = 'all' | 'overdue' | 'urgent' | 'active' | 'department';

const initialIssues: Issue[] = [
  {
    id: '1',
    title: 'Overdue Pothole',
    location: 'MG Road & Brigade Road',
    assignedTo: 'City Public Works',
    slaHours: 0,
    type: 'pothole',
    isEscalated: true,
    latitude: 12.9740,
    longitude: 77.6070
  },
  {
    id: '2',
    title: 'Water Leak',
    location: 'Indiranagar 100ft Road',
    assignedTo: 'Water Authority',
    slaHours: 18,
    type: 'water-leak',
    latitude: 12.9784,
    longitude: 77.6408
  },
];

function EscalationModal({
  isOpen,
  onClose,
  issue,
  escalationContent,
  isLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  escalationContent: EscalationContent | null;
  isLoading: boolean;
}) {
  if (!isOpen || !issue) return null;

  const aiEnabled = isGeminiConfigured();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">SLA Breached - Escalation</h2>
              {aiEnabled && (
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-Generated Response
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-primary-200 rounded-full animate-ping opacity-30" />
              <div className="relative bg-white rounded-full w-16 h-16 flex items-center justify-center border-2 border-primary-200">
                <Sparkles className="w-8 h-8 text-primary-500 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-600 font-medium">Generating AI response...</p>
            <p className="text-slate-400 text-sm mt-1">Creating personalized escalation content</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-5 h-5 text-sky-600" />
                <h3 className="font-semibold text-sky-900">{aiEnabled ? 'AI-Generated Tweet' : 'Auto-Generated Tweet'}</h3>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-200">
                <p className="text-slate-700 leading-relaxed">{escalationContent?.tweet}</p>
                <div className="mt-3 flex gap-2">
                  <button className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Post to Twitter
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">{aiEnabled ? 'AI-Crafted CSR Proposal' : 'CSR Sponsorship Proposal'}</h3>
              </div>
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <p className="text-slate-700 mb-3">
                  {escalationContent?.csrProposal?.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{escalationContent?.csrProposal?.amount}</p>
                    <p className="text-sm text-slate-500">Sponsorship Amount</p>
                  </div>
                  <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Send Proposal
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-xs text-slate-500">
                    Includes: {escalationContent?.csrProposal?.benefits}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueCard({
  issue,
  onEscalate
}: {
  issue: Issue;
  onEscalate: (issueId: string) => void;
}) {
  const isOverdue = issue.slaHours <= 0 || issue.isEscalated;
  const isUrgent = issue.slaHours > 0 && issue.slaHours <= 12 && !issue.isEscalated;
  const Icon = issue.type === 'pothole' ? AlertTriangle : Droplets;

  const canEscalate = !issue.isEscalated && issue.isSimulated;

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${isOverdue ? 'border-red-300' : isUrgent ? 'border-amber-200' : 'border-slate-200'} overflow-hidden transition-all hover:shadow-md`}>
      <div className={`p-4 ${isOverdue ? 'bg-red-50' : 'bg-white'}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${issue.type === 'pothole' ? 'bg-red-100' : 'bg-blue-100'}`}>
            <Icon className={`w-5 h-5 ${issue.type === 'pothole' ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${isOverdue ? 'text-red-700' : 'text-slate-800'}`}>
              {issue.title}
            </h3>
            <div className="mt-1 space-y-1">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {issue.location}
              </p>
              <p className="text-sm text-slate-500">
                Assigned to: <span className="text-slate-700 font-medium">{issue.assignedTo}</span>
              </p>
            </div>
          </div>
        </div>

        <div className={`mt-4 flex items-center justify-between p-3 rounded-lg ${
          isOverdue ? 'bg-red-100' : isUrgent ? 'bg-amber-50' : 'bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <Timer className={`w-4 h-4 ${isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-slate-500'}`} />
            <span className={`text-sm font-medium ${isOverdue ? 'text-red-700' : isUrgent ? 'text-amber-700' : 'text-slate-600'}`}>
              SLA: {isOverdue ? 'BREACHED' : `${issue.slaHours} Hours Remaining`}
            </span>
          </div>
          {isOverdue && (
            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-medium">
              ESCALATED
            </span>
          )}
        </div>

        {canEscalate && (
          <button
            onClick={() => onEscalate(issue.id)}
            className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Simulate SLA Breach (Escalate)
          </button>
        )}
      </div>
    </div>
  );
}

function MapComponent({ issues, newIssue }: { issues: Issue[]; newIssue?: Issue | null }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [77.5946, 12.9716], // Bengaluru Longitude, Latitude
      zoom: 12
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for all issues
    const allIssues = [...issues, ...(newIssue ? [newIssue] : [])];

    allIssues.forEach(issue => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center cursor-pointer';
      el.style.width = '36px';
      el.style.height = '36px';

      const isOverdue = issue.slaHours <= 0 || issue.isEscalated;
      const bgColor = issue.type === 'pothole'
        ? (isOverdue ? 'bg-red-500' : 'bg-red-400')
        : (isOverdue ? 'bg-blue-500' : 'bg-blue-400');

      el.innerHTML = `
        <div class="${bgColor} rounded-full border-3 border-white shadow-lg flex items-center justify-center" style="width: 28px; height: 28px; border-width: 3px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      // Create popup
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-slate-800">${issue.title}</h3>
          <p class="text-sm text-slate-600">${issue.location}</p>
          <p class="text-xs text-slate-500 mt-1">Status: ${isOverdue ? 'ESCALATED' : `${issue.slaHours}h remaining`}</p>
        </div>
      `);

      // Create and add marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([issue.longitude, issue.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
    });

    // Fly to new issue if detected
    if (newIssue) {
      map.current.flyTo({
        center: [newIssue.longitude, newIssue.latitude],
        zoom: 14,
        duration: 1500
      });
    }
  }, [issues, newIssue]);

  return (
    <div className="relative rounded-xl overflow-hidden h-full min-h-[400px]" ref={mapContainer}>
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md flex items-center gap-2 z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-medium text-slate-700">Live Issue Map</span>
      </div>
      <div className="absolute bottom-3 left-3 bg-slate-800/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-white z-10">
        Powered by OpenStreetMap
      </div>
    </div>
  );
}

function LoadingOverlay() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-primary-200 rounded-full animate-ping opacity-30" />
          <div className="relative bg-white rounded-full w-20 h-20 flex items-center justify-center border-4 border-primary-100">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Phone Accelerometer</h3>
        <p className="text-slate-500">Detecting road anomalies{dots}</p>
        <div className="mt-4 flex justify-center gap-1">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  count,
  label,
  icon: Icon,
  iconBg,
  iconColor,
  isActive,
  onClick
}: {
  count: number;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm border transition-all w-full text-left cursor-pointer ${
        isActive
          ? 'border-primary-500 ring-2 ring-primary-200 shadow-md'
          : 'border-slate-200 hover:border-primary-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className={`text-2xl font-bold ${isActive ? 'text-primary-600' : 'text-slate-800'}`}>{count}</p>
          <p className={`text-xs ${isActive ? 'text-primary-600 font-medium' : 'text-slate-500'}`}>{label}</p>
        </div>
      </div>
    </button>
  );
}

function DepartmentDropdown({
  isOpen,
  onClose,
  departments,
  selectedDepartment,
  onSelect,
  anchorRef
}: {
  isOpen: boolean;
  onClose: () => void;
  departments: string[];
  selectedDepartment: string | null;
  onSelect: (dept: string) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || !anchorRef.current) return null;

  const rect = anchorRef.current.getBoundingClientRect();

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      }}
    >
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter by Department</p>
      </div>
      <div className="py-1">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => {
              onSelect(dept);
              onClose();
            }}
            className={`w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
              selectedDepartment === dept
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 opacity-60" />
              {dept}
            </span>
            {selectedDepartment === dept && (
              <Check className="w-4 h-4 text-primary-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function DepartmentCard({
  count,
  label,
  icon: Icon,
  iconBg,
  iconColor,
  isActive,
  departments,
  selectedDepartment,
  onSelectDepartment,
  onClearFilter
}: {
  count: number;
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  isActive: boolean;
  departments: string[];
  selectedDepartment: string | null;
  onSelectDepartment: (dept: string) => void;
  onClearFilter: () => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`bg-white rounded-xl p-4 shadow-sm border transition-all w-full text-left cursor-pointer ${
          isActive
            ? 'border-green-500 ring-2 ring-green-200 shadow-md'
            : 'border-slate-200 hover:border-green-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBg} rounded-lg`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <p className={`text-2xl font-bold ${isActive ? 'text-green-600' : 'text-slate-800'}`}>{count}</p>
            <div className="flex items-center justify-between">
              <p className={`text-xs ${isActive ? 'text-green-600 font-medium' : 'text-slate-500'}`}>{label}</p>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
      </button>
      <DepartmentDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        departments={departments}
        selectedDepartment={selectedDepartment}
        onSelect={onSelectDepartment}
        anchorRef={buttonRef}
      />
    </div>
  );
}

function App() {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [newIssue, setNewIssue] = useState<Issue | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalatedIssue, setEscalatedIssue] = useState<Issue | null>(null);
  const [escalationContent, setEscalationContent] = useState<EscalationContent | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [detectedCountdown, setDetectedCountdown] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Extract unique departments from issues
  const departments = useMemo(() => {
    const uniqueDepts = [...new Set(issues.map(i => i.assignedTo))];
    return uniqueDepts;
  }, [issues]);

  // Filter issues based on active filter
  const filteredIssues = useMemo(() => {
    let result = issues;

    if (activeFilter === 'overdue') {
      result = result.filter(i => i.slaHours <= 0 || i.isEscalated);
    } else if (activeFilter === 'urgent') {
      result = result.filter(i => i.slaHours > 0 && i.slaHours <= 12 && !i.isEscalated);
    }

    if (selectedDepartment) {
      result = result.filter(i => i.assignedTo === selectedDepartment);
    }

    return result;
  }, [issues, activeFilter, selectedDepartment]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: issues.length,
    overdue: issues.filter(i => i.slaHours <= 0 || i.isEscalated).length,
    urgent: issues.filter(i => i.slaHours > 0 && i.slaHours <= 12 && !i.isEscalated).length,
    departments: departments.length
  }), [issues, departments]);

  const handleSimulateDrive = useCallback(() => {
    setIsDetecting(true);
    setDetectedCountdown(48);

    setTimeout(() => {
      setIsDetecting(false);

      const detected: Issue = {
        id: Date.now().toString(),
        title: 'Severe Pothole Detected',
        location: 'Koramangala 80ft Road',
        assignedTo: 'City Public Works',
        slaHours: 48,
        type: 'pothole',
        isSimulated: true,
        isEscalated: false,
        latitude: 12.9352,
        longitude: 77.6245
      };

      setIssues(prev => [detected, ...prev]);
      setNewIssue(detected);

      setTimeout(() => {
        setNewIssue(null);
      }, 3000);
    }, 3000);
  }, []);

  // Countdown timer for the detected issue
  useEffect(() => {
    if (detectedCountdown === null) return;

    const timer = setInterval(() => {
      setDetectedCountdown(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return null;
        }
        return prev - 0.001;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [detectedCountdown]);

  // Update the detected issue with countdown
  useEffect(() => {
    if (detectedCountdown !== null && detectedCountdown > 0) {
      setIssues(prev =>
        prev.map(issue =>
          issue.isSimulated && !issue.isEscalated
            ? { ...issue, slaHours: Math.max(0, Math.round(detectedCountdown * 10) / 10) }
            : issue
        )
      );
    }
  }, [detectedCountdown]);

  const handleEscalate = useCallback(async (issueId: string) => {
    // Find the issue first
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    // Update issue state
    const escalatedIssue = {
      ...issue,
      slaHours: 0,
      title: issue.title.includes('OVERDUE') ? issue.title : `${issue.title} - OVERDUE`,
      isEscalated: true
    };

    setIssues(prev =>
      prev.map(i => i.id === issueId ? escalatedIssue : i)
    );

    setEscalatedIssue(escalatedIssue);
    setEscalationContent(null);
    setIsGeneratingContent(true);
    setShowEscalationModal(true);
    setDetectedCountdown(null);

    // Generate AI content
    const content = await generateEscalationContent(
      issue.title,
      issue.location,
      issue.type,
      issue.assignedTo
    );

    setEscalationContent(content);
    setIsGeneratingContent(false);
  }, [issues]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(prev => prev === filter ? 'all' : filter);
  }, []);

  const handleSelectDepartment = useCallback((dept: string) => {
    setSelectedDepartment(prev => prev === dept ? null : dept);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setActiveFilter('all');
    setSelectedDepartment(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 rounded-lg p-2">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Civic Accountability Engine</h1>
                <p className="text-xs text-slate-500 hidden sm:block">AI-Powered Issue Detection & Resolution</p>
              </div>
            </div>
            <button
              onClick={isDetecting ? undefined : handleSimulateDrive}
              disabled={isDetecting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white transition-all transform hover:scale-105 active:scale-95 ${
                isDetecting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-primary-600 hover:from-cyan-600 hover:to-primary-700 shadow-lg shadow-primary-500/30'
              }`}
            >
              <Car className="w-5 h-5" />
              <span className="hidden sm:inline">Simulate Drive</span>
              <span className="sm:hidden">Drive</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            count={stats.total}
            label="Active Issues"
            icon={AlertTriangle}
            iconBg="bg-primary-100"
            iconColor="text-primary-600"
            isActive={activeFilter === 'active'}
            onClick={() => handleFilterChange('active')}
          />
          <StatCard
            count={stats.overdue}
            label="Overdue"
            icon={Timer}
            iconBg="bg-red-100"
            iconColor="text-red-600"
            isActive={activeFilter === 'overdue'}
            onClick={() => handleFilterChange('overdue')}
          />
          <StatCard
            count={stats.urgent}
            label="Urgent"
            icon={Clock}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            isActive={activeFilter === 'urgent'}
            onClick={() => handleFilterChange('urgent')}
          />
          <DepartmentCard
            count={stats.departments}
            label="Departments"
            icon={Building2}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            isActive={selectedDepartment !== null}
            departments={departments}
            selectedDepartment={selectedDepartment}
            onSelectDepartment={handleSelectDepartment}
            onClearFilter={() => setSelectedDepartment(null)}
          />
        </div>

        {/* Filter indicator */}
        {(activeFilter !== 'all' || selectedDepartment) && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">
              {selectedDepartment && (
                <>
                  Filtering by: <span className="font-medium text-green-600">{selectedDepartment}</span>
                  {activeFilter !== 'all' && <span className="mx-1">·</span>}
                </>
              )}
              {activeFilter !== 'all' && (
                <span>
                  Showing <span className="font-medium">{activeFilter}</span> issues
                </span>
              )}
            </span>
            <button
              onClick={handleClearAllFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Map */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-full">
  <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
    <MapPin className="w-5 h-5 text-primary-600" /> Issue Location Map
  </h2>
  
  <div className="flex-1 w-full min-h-[400px] rounded-lg overflow-hidden relative">
    <MapComponent issues={issues} newIssue={newIssue} />
  </div>
</div>

          {/* Right: Issue Feed */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Issue Feed</h2>
              <span className="text-sm text-slate-500">
                {filteredIssues.length} {filteredIssues.length === 1 ? 'issue' : 'issues'}
              </span>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {filteredIssues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onEscalate={handleEscalate}
                />
              ))}
              {filteredIssues.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No issues match the current filter</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      {isDetecting && <LoadingOverlay />}

      {/* Escalation Modal */}
      <EscalationModal
        isOpen={showEscalationModal}
        onClose={() => setShowEscalationModal(false)}
        issue={escalatedIssue}
        escalationContent={escalationContent}
        isLoading={isGeneratingContent}
      />
    </div>
  );
}

export default App;
