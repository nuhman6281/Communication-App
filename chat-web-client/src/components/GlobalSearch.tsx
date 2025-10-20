import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Modal, ModalHeader, ModalBody } from './ui/modal';
import { Search, X, MessageSquare, Users, FileText, Hash, Clock } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'message' | 'conversation' | 'file' | 'contact';
  title: string;
  subtitle?: string;
  content?: string;
  avatar?: string;
  timestamp?: string;
  conversationName?: string;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'message',
    title: 'Sarah Johnson',
    content: 'That sounds great! See you tomorrow at the meeting',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    timestamp: '2h ago',
    conversationName: 'Sarah Johnson',
  },
  {
    id: '2',
    type: 'message',
    title: 'Design Team',
    content: 'Alex: Can we schedule a meeting to discuss the new features?',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DT',
    timestamp: '1d ago',
    conversationName: 'Design Team',
  },
  {
    id: '3',
    type: 'conversation',
    title: 'Project Alpha',
    subtitle: '8 members',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PA',
  },
  {
    id: '4',
    type: 'contact',
    title: 'Michael Chen',
    subtitle: 'Software Engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  },
  {
    id: '5',
    type: 'file',
    title: 'project-proposal.pdf',
    subtitle: 'Shared by Emma Wilson • 2.4 MB',
    timestamp: '3d ago',
  },
];

interface GlobalSearchProps {
  onClose: () => void;
  onResultClick?: (result: SearchResult) => void;
}

export function GlobalSearch({ onClose, onResultClick }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'messages' | 'conversations' | 'files' | 'contacts'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'project updates',
    'design meeting',
    'budget report',
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.trim()) {
      // Simulate search
      const filtered = mockSearchResults.filter((result) => {
        const matchesQuery =
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.content?.toLowerCase().includes(query.toLowerCase());
        const matchesFilter =
          filter === 'all' ||
          (filter === 'messages' && result.type === 'message') ||
          (filter === 'conversations' && result.type === 'conversation') ||
          (filter === 'files' && result.type === 'file') ||
          (filter === 'contacts' && result.type === 'contact');
        return matchesQuery && matchesFilter;
      });
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, filter]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      setRecentSearches((prev) => [searchQuery, ...prev.slice(0, 4)]);
    }
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'conversation':
        return <Hash className="w-4 h-4" />;
      case 'file':
        return <FileText className="w-4 h-4" />;
      case 'contact':
        return <Users className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const highlightQuery = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 dark:bg-yellow-900">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      maxWidth="2xl"
      footerContent={
        <>
          <span>Press ESC to close</span>
          <span>↑↓ to navigate • ↵ to select</span>
        </>
      }
    >
      {/* Search Input */}
      <ModalHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search messages, files, contacts..."
            className="pl-10 pr-10 h-12 text-base"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </ModalHeader>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'messages', 'conversations', 'files', 'contacts'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm shrink-0 transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <ModalBody>
        {!query ? (
          /* Recent Searches */
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Recent Searches</span>
            </div>
            <div className="space-y-2">
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(search)}
                  className="w-full p-2 rounded-lg hover:bg-muted text-left flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          /* No Results */
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
            <Search className="w-12 h-12 mb-2 opacity-50" />
            <p>No results found for "{query}"</p>
          </div>
        ) : (
          /* Search Results */
          <div className="divide-y divide-border">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  onResultClick?.(result);
                  onClose();
                }}
                className="w-full p-4 flex items-start gap-3 hover:bg-muted/50 text-left transition-colors"
              >
                {result.avatar ? (
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={result.avatar} />
                    <AvatarFallback>{result.title.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {getResultIcon(result.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="truncate">{highlightQuery(result.title)}</p>
                    {result.type === 'message' && result.timestamp && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {result.timestamp}
                      </span>
                    )}
                  </div>
                  {result.subtitle && (
                    <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                  )}
                  {result.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {highlightQuery(result.content)}
                    </p>
                  )}
                  {result.conversationName && (
                    <div className="flex items-center gap-1 mt-1">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {result.conversationName}
                      </span>
                    </div>
                  )}
                </div>

                <Badge variant="outline" className="shrink-0">
                  {result.type}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
