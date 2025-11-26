import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Zap, Battery, TrendingUp } from 'lucide-react';
import Card from '../ui/Card';

interface TimelineEvent {
  id: string;
  time: string;
  type: 'accepted' | 'suggested' | 'override' | 'anomaly';
  action: string;
  details?: string;
  impact?: string;
}

const ControlActionTimeline: React.FC = () => {
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());

  // Generate mock timeline events for the last 24 hours
  const generateTimelineEvents = (): TimelineEvent[] => {
    const now = new Date();
    const events: TimelineEvent[] = [];
    
    // Generate events for last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      // Add 1-3 events per hour
      const eventCount = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < eventCount; j++) {
        const types: Array<'accepted' | 'suggested' | 'override' | 'anomaly'> = ['accepted', 'suggested', 'override', 'anomaly'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let action = '';
        let details = '';
        let impact = '';
        
        switch (type) {
          case 'accepted':
            action = 'Battery Discharge Initiated';
            details = 'RL suggestion accepted';
            impact = '₹450 saved';
            break;
          case 'suggested':
            action = 'Grid Import Reduction';
            details = 'AI recommendation pending';
            impact = 'Expected: ₹320 savings';
            break;
          case 'override':
            action = 'Manual Battery Charge';
            details = 'Operator override';
            impact = 'Cost: ₹180';
            break;
          case 'anomaly':
            action = 'Voltage Fluctuation Detected';
            details = 'Anomaly threshold exceeded';
            impact = 'No action taken';
            break;
        }
        
        events.push({
          id: `${i}-${j}`,
          time: hourStr,
          type,
          action,
          details,
          impact,
        });
      }
    }
    
    return events.sort((a, b) => {
      const timeA = parseInt(a.time.split(':')[0]);
      const timeB = parseInt(b.time.split(':')[0]);
      return timeB - timeA; // Most recent first
    });
  };

  const [events] = useState<TimelineEvent[]>(generateTimelineEvents());

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'accepted':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'suggested':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'override':
        return <XCircle className="w-5 h-5 text-orange-500" />;
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'accepted':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      case 'suggested':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'override':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'anomaly':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
    }
  };

  const getEventLabel = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'accepted':
        return 'Accepted';
      case 'suggested':
        return 'Suggested';
      case 'override':
        return 'Override';
      case 'anomaly':
        return 'Anomaly';
    }
  };

  // Filter events by selected hour
  const filteredEvents = events.filter(event => {
    const eventHour = parseInt(event.time.split(':')[0]);
    return eventHour === selectedHour;
  });

  // Generate hour markers for 24-hour timeline
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card title="Control Action Timeline (24 Hours)" className="mt-6">
      {/* Hour Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Hour:</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedHour.toString().padStart(2, '0')}:00 - {(selectedHour + 1) % 24}:00
          </span>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {hours.map((hour) => {
              const hourEvents = events.filter(e => parseInt(e.time.split(':')[0]) === hour);
              const isSelected = hour === selectedHour;
              const hasEvents = hourEvents.length > 0;
              
              return (
                <button
                  key={hour}
                  onClick={() => setSelectedHour(hour)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : hasEvents
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{hour.toString().padStart(2, '0')}:00</span>
                    {hasEvents && (
                      <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}>
                        {hourEvents.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No events for this hour</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`border-l-4 rounded-r-lg p-4 ${getEventColor(event.type)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {event.action}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        event.type === 'accepted'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : event.type === 'suggested'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : event.type === 'override'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {getEventLabel(event.type)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {event.time}
                    </span>
                  </div>
                  {event.details && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {event.details}
                    </p>
                  )}
                  {event.impact && (
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {event.impact}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {events.filter(e => e.type === 'accepted').length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Accepted</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {events.filter(e => e.type === 'suggested').length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Suggested</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {events.filter(e => e.type === 'override').length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overrides</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {events.filter(e => e.type === 'anomaly').length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Anomalies</div>
        </div>
      </div>
    </Card>
  );
};

export default ControlActionTimeline;

