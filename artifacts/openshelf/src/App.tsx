import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, FileText, ImagePlus, Library, LoaderCircle, Music2, Pause, Play, Search, Sun, Upload, Volume2, X } from 'lucide-react';
import { Route, Switch } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getListBookReviewsQueryKey, useCreateBookReview, useListBookReviews } from '@workspace/api-client-react';
import { Star } from 'lucide-react';

const SUPABASE_URL = 'https://kdycmaicayaesnpkqfgp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LC_ZkgE8N9p_t6d7KIhC_w_437ZMCFH';
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
const supportedExtensions = ['.pdf', '.docx', '.epub', '.txt', '.rtf'];

type Book = {
  id: string | number;
  title: string;
  author: string;
  genre: string;
  book_url: string;
  cover_url: string;
  created_at?: string;
};
type Notice = { text: string; kind: 'progress' | 'success' | 'error' } | null;

type ThemeOption = { id: string; name: string; note: string };

const themes: ThemeOption[] = [
  { id: 'light', name: 'Daylight', note: 'Paper & evergreen' },
  { id: 'cozy', name: 'Cozy', note: 'Soft afternoon' },
  { id: 'cafe', name: 'Café', note: 'A little warmth' },
  { id: 'editorial', name: 'Editorial', note: 'Ink & parchment' },
  { id: 'dark', name: 'Dark Reading', note: 'Low light, easy reading' },
  { id: 'gallery', name: 'Gallery', note: 'Charcoal & ivory' },
];

const readerThemes = themes;

function useTheme(storageKey = 'openshelf-theme', options: ThemeOption[] = themes) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(storageKey) || 'light';
    return options.some((item) => item.id === stored) ? stored : 'light';
  });
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);
  return [theme, setTheme] as const;
}

function Brand() {
  return (
    <a className="brand-mark" href="/" aria-label="OpenShelf home">
      <img
        src="/ChatGPT%20Image%20Oct%209%2C%202026%2C%2012_02_25%20AM.png"
        alt="OpenShelf"
        className="brand-logo"
      />
    </a>
  );
}

function CommunityReviews({ bookId }: { bookId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useListBookReviews(bookId, {
    query: { enabled: Boolean(bookId), queryKey: getListBookReviewsQueryKey(bookId) },
  });
  const createReview = useCreateBookReview();
  const [rating, setRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitError, setSubmitError] = useState('');
  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');
    if (!rating) { setSubmitError('Choose a star rating before sharing your note.'); return; }
    if (!comment.trim()) { setSubmitError('Add a comment before sharing your note.'); return; }
    createReview.mutate({ bookId, data: { reviewerName: reviewerName.trim(), rating, comment: comment.trim() } }, {
      onSuccess: async () => {
        setRating(0); setReviewerName(''); setComment('');
        await queryClient.invalidateQueries({ queryKey: getListBookReviewsQueryKey(bookId) });
      },
      onError: (error) => setSubmitError(error instanceof Error ? error.message : 'Your review could not be sent. Please try again.'),
    });
  }
  return <section className="community-reviews" aria-labelledby="reviews-title" data-testid="section-community-reviews">
    <div className="review-intro">
      <span className="eyebrow">AFTER THE LAST PAGE</span><h2 id="reviews-title">Leave a little note.</h2>
      <p>Stories travel further when readers tell us what stayed with them.</p>
      <div className="review-summary" data-testid="review-summary">
        <strong>{data?.reviewCount ? data.averageRating.toFixed(1) : '—'}</strong>
        <span className="summary-stars" aria-label={data?.reviewCount ? `${data.averageRating.toFixed(1)} out of 5 stars` : 'No ratings yet'}>{[1,2,3,4,5].map((star) => <Star key={star} size={15} fill={data?.reviewCount && star <= Math.round(data.averageRating) ? 'currentColor' : 'none'} />)}</span>
        <small>{data?.reviewCount ?? 0} {data?.reviewCount === 1 ? 'reader' : 'readers'}</small>
      </div>
    </div>
    <div className="review-columns">
      <form className="review-form" onSubmit={submitReview} data-testid="form-book-review">
        <h3>Your two cents</h3><p className="review-form-note">No account needed. Your comment is public.</p>
        <fieldset className="rating-field"><legend>Your rating <span aria-hidden="true">*</span></legend><div className="rating-buttons" onMouseLeave={() => setHoverRating(0)}>{[1,2,3,4,5].map((star) => <button key={star} type="button" aria-label={`${star} star${star === 1 ? '' : 's'}`} aria-pressed={rating === star} onMouseEnter={() => setHoverRating(star)} onClick={() => setRating(star)} data-testid={`button-rating-${star}`}><Star size={24} fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} /></button>)}</div></fieldset>
        <label className="review-label">Display name <span>optional</span><input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} maxLength={80} placeholder="Reader" data-testid="input-reviewer-name" /></label>
        <label className="review-label">Your note<textarea value={comment} onChange={(event) => setComment(event.target.value)} required minLength={1} maxLength={2000} rows={4} placeholder="What would you tell the next reader?" data-testid="input-review-comment" /></label>
        {submitError && <p className="review-error" role="alert" data-testid="error-review-submit">{submitError}</p>}
        {createReview.isSuccess && !submitError && <p className="review-success" role="status" data-testid="status-review-submit">Your note is on the shelf. Thank you.</p>}
        <button className="button-primary review-submit" type="submit" disabled={createReview.isPending} data-testid="button-submit-review">{createReview.isPending ? 'Sharing your note…' : 'Share your note'} <ArrowRight size={16}/></button>
      </form>
      <div className="review-list" data-testid="review-list">
        {isLoading ? <div className="review-loading" aria-label="Loading reader notes">{[1,2].map((n) => <div className="review-skeleton" key={n}><i/><i/><i/></div>)}</div>
          : isError ? <div className="review-empty review-fetch-error" role="alert"><h3>Notes are out of reach.</h3><p>We couldn’t load the community reviews right now.</p><button className="button-secondary" type="button" onClick={() => void refetch()} data-testid="button-retry-reviews">Try again</button></div>
          : data?.reviews.length ? <>{data.reviews.map((review) => <article className="review-item" key={review.id} data-testid={`review-${review.id}`}><div className="review-item-top"><strong>{review.reviewerName || 'Reader'}</strong><time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time></div><div className="review-item-stars" aria-label={`${review.rating} out of 5 stars`}>{[1,2,3,4,5].map((star) => <Star key={star} size={13} fill={star <= review.rating ? 'currentColor' : 'none'} />)}</div><p>{review.comment}</p></article>)}</>
          : <div className="review-empty" data-testid="empty-reviews"><span className="review-empty-mark">01</span><h3>A fresh page.</h3><p>No notes yet. Be the first neighbor to leave one.</p></div>}
      </div>
    </div>
  </section>;
}

function ThemePicker({ theme, onChange, options = themes }: { theme: string; onChange: (theme: string) => void; options?: ThemeOption[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.theme-picker')) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  return <div className="theme-picker">
    <button id="themeButton" className="theme-trigger" type="button" onClick={() => setOpen(!open)} aria-expanded={open} data-testid="button-theme-menu">
      <Sun size={16} /><span>Reading mood</span><ChevronDown size={14} className={open ? 'chevron-up' : ''} />
    </button>
    {open && <div id="themeMenu" className="theme-menu" role="menu">
      <span className="menu-label">Choose a reading mood</span>
      {options.map((item) => <button type="button" key={item.id} role="menuitem" className={`theme-option ${theme === item.id ? 'selected' : ''}`} onClick={() => { onChange(item.id); setOpen(false); }} data-testid={`theme-${item.id}`}>
        <span className={`theme-swatch swatch-${item.id}`} />
        <span className="theme-copy"><strong>{item.name}</strong><small>{item.note}</small></span>
        {theme === item.id && <Check size={15} />}
      </button>)}
    </div>}
  </div>;
}

function LibraryPage() {
  const [theme, setTheme] = useTheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [notice, setNotice] = useState<Notice>(null);
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState('');
  const [selectedBookName, setSelectedBookName] = useState('');

  async function loadBooks() {
    setLoading(true);
    setLoadError('');
    const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (error) {
      setLoadError(error.message);
      setBooks([]);
    } else {
      setBooks((data || []) as Book[]);
    }
    setLoading(false);
  }
  useEffect(() => { void loadBooks(); }, []);

  const genres = useMemo(() => [...new Set(books.map((book) => (book.genre || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [books]);
  const filteredBooks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return books.filter((book) => {
      const matchesText = !needle || [book.title, book.author, book.genre].some((value) => String(value || '').toLowerCase().includes(needle));
      return matchesText && (genre === 'all' || book.genre === genre);
    });
  }, [books, search, genre]);

  function selectCover(file?: File) {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : '');
  }

  async function uploadBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const author = String(data.get('author') || '').trim();
    const bookGenre = String(data.get('genre') || '').trim();
    const bookFile = data.get('bookFile');
    const coverFile = data.get('coverFile');
    if (!title || !author || !bookGenre || !(bookFile instanceof File) || !bookFile.name || !(coverFile instanceof File) || !coverFile.name) {
      setNotice({ text: 'Please fill in every field and choose both files.', kind: 'error' });
      return;
    }
    const extension = bookFile.name.slice(bookFile.name.lastIndexOf('.')).toLowerCase();
    if (!supportedExtensions.includes(extension)) {
      setNotice({ text: 'Supported formats: PDF, DOCX, EPUB, TXT and RTF.', kind: 'error' });
      return;
    }
    if (!coverFile.type.startsWith('image/')) {
      setNotice({ text: 'The cover must be an image.', kind: 'error' });
      return;
    }
    const safeBase = bookFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'book';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const bookPath = `${uniqueId}-${safeBase}${extension}`;
    const coverExtension = (coverFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const coverPath = `${uniqueId}-cover.${coverExtension}`;
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.epub': 'application/epub+zip',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
    };
    setUploading(true);
    try {
      setNotice({ text: 'Uploading book file…', kind: 'progress' });
      const { error: bookError } = await supabase.storage.from('book_file').upload(bookPath, bookFile, { contentType: mimeTypes[extension], upsert: false });
      if (bookError) throw bookError;
      setNotice({ text: 'Uploading cover…', kind: 'progress' });
      const { error: coverError } = await supabase.storage.from('book-covers').upload(coverPath, coverFile, { contentType: coverFile.type, upsert: false });
      if (coverError) throw coverError;
      const { data: bookPublic } = supabase.storage.from('book_file').getPublicUrl(bookPath);
      const { data: coverPublic } = supabase.storage.from('book-covers').getPublicUrl(coverPath);
      setNotice({ text: 'Adding book to the shared library…', kind: 'progress' });
      const { error: insertError } = await supabase.from('books').insert({ title, author, genre: bookGenre, book_url: bookPublic.publicUrl, cover_url: coverPublic.publicUrl });
      if (insertError) throw insertError;
      form.reset();
      selectCover(undefined);
      setSelectedBookName('');
      setNotice({ text: 'Book added successfully.', kind: 'success' });
      await loadBooks();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setNotice({ text: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, kind: 'error' });
    } finally {
      setUploading(false);
    }
  }

  return <main className="library-page">
    <header className="topbar">
      <div className="topbar-inner"><Brand /><div className="topbar-right"><span className="topbar-note"><span className="status-dot" /> A shared reading room</span><ThemePicker theme={theme} onChange={setTheme} /></div></div>
    </header>
    <section className="welcome-band">
      <div className="welcome-inner">
        <div className="welcome-copy"><span className="eyebrow">A COMMUNITY-POWERED LIBRARY</span><h1>Read something<br /><em>worth remembering.</em></h1><p>Discover books shared by readers and add your own.</p>
          <label className="hero-search"><Search size={18} /><input id="searchInput" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, author, or genre..." autoComplete="off" aria-label="Search by title, author, or genre" data-testid="input-hero-search" /></label>
          <a className="welcome-link" href="#collection">Browse the collection <ArrowRight size={16} /></a>
        </div>
        <div className="shelf-illustration" aria-hidden="true">
          <div className="sun-disc" /><div className="sprig sprig-one" /><div className="sprig sprig-two" />
          <div className="illustration-books"><span className="illo-book book-one" /><span className="illo-book book-two" /><span className="illo-book book-three" /><span className="illo-book book-four" /><span className="illo-book book-five" /></div>
          <div className="shelf-line" /><span className="illustration-caption">TAKE A BOOK. LEAVE A STORY.</span>
        </div>
        <div className="welcome-stamp"><Library size={17} /><span>OPEN<br />SHELF</span></div>
      </div>
    </section>
    <div className="page-body">
      <section className="collection-section" id="collection">
        <div className="section-heading"><div><span className="eyebrow">THE NEIGHBORHOOD COLLECTION</span><h2>On the shelves <span className="count-label">{books.length ? `(${books.length})` : ''}</span></h2></div><p>Freshly shared, ready to explore.</p></div>
        <div className="library-toolbar"><span className="toolbar-note">{filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} to explore</span>
          <label className="genre-select-wrap"><span className="sr-only">Filter by genre</span><select id="genreFilter" value={genre} onChange={(event) => setGenre(event.target.value)} aria-label="Filter by genre" data-testid="select-genre"><option value="all">All genres</option>{genres.map((item) => <option value={item} key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
        </div>

        {loading ? <div className="skeleton-grid" aria-label="Loading library">{[0, 1, 2, 3, 4, 5].map((item) => <div className="book-skeleton" key={item}><div className="skeleton-cover" /><div className="skeleton-line short" /><div className="skeleton-line" /></div>)}</div>
          : loadError ? <div className="state-panel error-panel" role="alert"><span className="state-icon"><X size={20} /></span><h3>We couldn’t open the shelves.</h3><p>{loadError}</p><button className="button-secondary" type="button" onClick={() => void loadBooks()} data-testid="button-retry-load">Try again</button></div>
            : filteredBooks.length ? <div className="book-grid" data-testid="book-grid">{filteredBooks.map((book, index) => <a className="book-card" href={`/reader.html?id=${encodeURIComponent(book.id)}`} key={book.id} data-testid={`book-card-${book.id}`}>
              <div className={`cover-wrap cover-tone-${index % 5}`}>{book.cover_url ? <img src={book.cover_url} alt={`${book.title || 'Book'} cover`} loading="lazy" /> : <div className="cover-fallback"><BookOpen size={28} /><span>No cover</span></div>}<span className="cover-open"><ArrowRight size={16} /></span></div>
              <div className="book-meta"><span className="genre-kicker">{book.genre || 'Uncategorized'}</span><h3>{book.title || 'Untitled'}</h3><p>{book.author || 'Unknown author'}</p></div>
            </a>)}</div>
            : <div className="state-panel empty-panel" data-testid="empty-library"><span className="state-icon"><BookOpen size={20} /></span><h3>{books.length ? 'Nothing on this shelf yet.' : 'The shelves are waiting.'}</h3><p>{books.length ? 'Try another search or choose a different genre.' : 'Be the neighbor who leaves the first good read.'}</p>{(search || genre !== 'all') && <button className="text-button" type="button" onClick={() => { setSearch(''); setGenre('all'); }}>Clear filters</button>}</div>}
      </section>

      <section className="contribute-section" id="contribute">
        <div className="contribute-intro"><div className="contribute-number">01 <span>— CONTRIBUTE</span></div><h2>Add a book<br />to <em>OpenShelf.</em></h2><p>Every book here was shared by someone nearby. Add one you think deserves another set of hands.</p><div className="formats-note"><FileText size={17} /><span>PDF, DOCX, EPUB, TXT or RTF</span></div></div>
        <form id="bookForm" className="upload-card" onSubmit={uploadBook} noValidate>
          <div className="upload-card-heading"><div><span className="eyebrow">CONTRIBUTE</span><h3>Add a book</h3></div><span className="upload-mark"><Upload size={18} /></span></div>
          <div className="form-fields">
            <label className="field-label">Book title<input id="bookTitle" name="title" type="text" placeholder="e.g. The Secret Garden" required maxLength={180} data-testid="input-book-title" /></label>
            <div className="field-row"><label className="field-label">Author<input id="bookAuthor" name="author" type="text" placeholder="Who wrote it?" required maxLength={140} data-testid="input-book-author" /></label><label className="field-label">Genre<input id="bookGenre" name="genre" type="text" placeholder="e.g. Fiction" required maxLength={80} data-testid="input-book-genre" /></label></div>
            <div className="file-row">
              <label className="file-drop book-file-drop"><input id="bookFile" name="bookFile" type="file" accept=".pdf,.docx,.epub,.txt,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/epub+zip,text/plain,application/rtf" required onChange={(event) => setSelectedBookName(event.currentTarget.files?.[0]?.name || '')} data-testid="input-book-file" /><span className="file-icon"><FileText size={19} /></span><span className="file-copy"><strong>Book file</strong><small>{selectedBookName || 'Choose a document'}</small></span><span className="file-plus">+</span></label>
              <label className="file-drop cover-file-drop"><input id="coverFile" name="coverFile" type="file" accept="image/*" required onChange={(event) => selectCover(event.currentTarget.files?.[0])} data-testid="input-cover-file" />{coverPreview ? <img className="cover-preview" src={coverPreview} alt="Selected cover preview" /> : <span className="file-icon"><ImagePlus size={19} /></span>}<span className="file-copy"><strong>Cover image</strong><small>{coverPreview ? 'Selected' : 'Choose an image'}</small></span><span className="file-plus">+</span></label>
            </div>
            {notice && <div id="uploadStatus" className={`upload-notice notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'} data-testid="status-upload">{notice.kind === 'progress' && <LoaderCircle className="spin" size={16} />}{notice.kind === 'success' && <Check size={16} />}{notice.kind === 'error' && <X size={16} />}{notice.text}</div>}
            <button className="button-primary submit-button" type="submit" disabled={uploading} data-testid="button-submit-book">{uploading ? <><LoaderCircle size={17} className="spin" /> Adding to the shelves…</> : <>Add to OpenShelf <ArrowRight size={17} /></>}</button>
          </div>
          <p className="privacy-note">Shared with readers in this little library.</p>
        </form>
      </section>
      <footer className="page-footer"><Brand /><span>Pass a good story along.</span><span className="footer-credit">Developed by Nikender Singh</span><a href="#collection">Back to shelves <ArrowRight size={14} /></a></footer>
    </div>
  </main>;
}

function ReaderPage() {
  const [theme, setTheme] = useTheme('openshelf-reader-theme', readerThemes);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('openshelf-font-size')) || 18);
  const [formatContent, setFormatContent] = useState<{ html?: string; text?: string } | null>(null);
  const [musicFileName, setMusicFileName] = useState('');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.35);
  const [musicStatus, setMusicStatus] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const epubContainerRef = useRef<HTMLDivElement>(null);
  const epubRendition = useRef<any>(null);
  const musicFileInputRef = useRef<HTMLInputElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);
  const musicObjectUrlRef = useRef<string | null>(null);
  const id = new URLSearchParams(window.location.search).get('id');
  useEffect(() => {
    let active = true;
    async function fetchBook() {
      if (!id) { setError('No book was selected.'); setLoading(false); return; }
      const { data, error: queryError } = await supabase.from('books').select('*').eq('id', id).single();
      if (!active) return;
      if (queryError) setError(queryError.message);
      else setBook(data as Book);
      setLoading(false);
    }
    void fetchBook();
    return () => { active = false; };
  }, [id]);
  const extension = book?.book_url?.split(/[?#]/)[0].split('/').pop()?.split('.').pop()?.toLowerCase() || '';
  useEffect(() => {
    let active = true;
    async function loadDocument() {
      if (!book?.book_url) return;
      setFormatContent(null);
      setMessage('');
      try {
        if (extension === 'pdf') return;
        if (extension === 'epub') {
          await loadExternalScript('https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js');
          if (!active || !epubContainerRef.current) return;
          const epubFactory = (window as unknown as { ePub: (url: string) => any }).ePub;
          const epub = epubFactory(book.book_url);
          const rendition = epub.renderTo(epubContainerRef.current, { width: '100%', height: '100%', spread: 'none' });
          epubRendition.current = rendition;
          await rendition.display();
          if (active) {
            rendition.themes.fontSize(`${fontSize}px`);
            applyEpubTheme(rendition, theme);
          }
          return;
        }
        if (extension === 'txt' || extension === 'rtf') {
          const response = await fetch(book.book_url);
          if (!response.ok) throw new Error(`Could not download the ${extension.toUpperCase()} file.`);
          const raw = await response.text();
          if (!active) return;
          const text = extension === 'rtf' ? rtfToPlainText(raw) : raw;
          setFormatContent({ text });
          return;
        }
        if (extension === 'docx') {
          await loadExternalScript('https://cdn.jsdelivr.net/npm/mammoth@1.13.0/mammoth.browser.min.js');
          const response = await fetch(book.book_url);
          if (!response.ok) throw new Error('Could not download the DOCX file.');
          const result = await (window as unknown as { mammoth: { convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> } }).mammoth.convertToHtml({ arrayBuffer: await response.arrayBuffer() });
          if (active) setFormatContent({ html: result.value });
          return;
        }
        throw new Error('Unsupported book format. Supported formats: PDF, DOCX, EPUB, TXT and RTF.');
      } catch (loadError) {
        if (active) setMessage(`Could not open this book: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`);
      }
    }
    void loadDocument();
    return () => { active = false; };
  }, [book, extension]);

  useEffect(() => {
    localStorage.setItem('openshelf-font-size', String(fontSize));
    if (contentRef.current) contentRef.current.style.setProperty('--reader-font-size', `${fontSize}px`);
    epubRendition.current?.themes.fontSize(`${fontSize}px`);
  }, [fontSize]);

  useEffect(() => {
    if (epubRendition.current) applyEpubTheme(epubRendition.current, theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const width = scrollable <= 0 ? 100 : Math.min(100, Math.max(0, window.scrollY / scrollable * 100));
      document.documentElement.style.setProperty('--reading-progress', `${width}%`);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => () => {
    musicAudioRef.current?.pause();
    if (musicObjectUrlRef.current) URL.revokeObjectURL(musicObjectUrlRef.current);
  }, []);

  function handleMusicFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const supportedAudio = ['mp3', 'm4a', 'mp4', 'wav', 'ogg', 'opus', 'flac', 'aac', 'webm'].includes(extension);
    if (!file.type.startsWith('audio/') && !supportedAudio) {
      setMusicStatus('Choose an audio file such as MP3, M4A, WAV, or OGG.');
      return;
    }

    const player = musicAudioRef.current;
    if (!player) return;
    player.pause();
    const objectUrl = URL.createObjectURL(file);
    if (musicObjectUrlRef.current) URL.revokeObjectURL(musicObjectUrlRef.current);
    musicObjectUrlRef.current = objectUrl;
    player.src = objectUrl;
    player.loop = true;
    player.volume = musicVolume;
    player.load();
    setMusicFileName(file.name);
    setMusicStatus('');
    void player.play().catch(() => {
      setMusicPlaying(false);
      setMusicStatus('This file could not be played. Try another audio file.');
    });
  }

  async function toggleMusic() {
    const player = musicAudioRef.current;
    if (!musicFileName) {
      musicFileInputRef.current?.click();
      return;
    }
    if (!player) return;
    if (player.paused) {
      try {
        await player.play();
        setMusicStatus('');
      } catch {
        setMusicStatus('This file could not be played. Try another audio file.');
      }
    } else {
      player.pause();
    }
  }

  function removeMusic() {
    const player = musicAudioRef.current;
    player?.pause();
    if (player) {
      player.removeAttribute('src');
      player.load();
    }
    if (musicObjectUrlRef.current) URL.revokeObjectURL(musicObjectUrlRef.current);
    musicObjectUrlRef.current = null;
    setMusicFileName('');
    setMusicPlaying(false);
    setMusicStatus('');
  }

  function changeMusicVolume(event: ChangeEvent<HTMLInputElement>) {
    const volume = Number(event.currentTarget.value);
    setMusicVolume(volume);
    if (musicAudioRef.current) musicAudioRef.current.volume = volume;
  }

  function highlightSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setMessage('Select some text first, then press Highlight.');
      return;
    }
    try {
      selection.getRangeAt(0).surroundContents(document.createElement('mark'));
      selection.removeAllRanges();
      setMessage('');
    } catch {
      setMessage('That selection cannot be highlighted.');
    }
  }
  const displayedFile = extension === 'pdf' ? <iframe className="pdf-reader" src={`${book?.book_url}#toolbar=1&navpanes=0&view=FitH`} title="PDF reader" /> : extension === 'epub' ? <div ref={epubContainerRef} className="epub-reader" /> : formatContent?.html ? <article className="reader-text docx-content" dangerouslySetInnerHTML={{ __html: formatContent.html }} /> : formatContent?.text !== undefined ? <article className="reader-text">{formatContent.text}</article> : null;
  return <main className="reader-page">
    <div className="reading-progress"><div className="reading-progress-bar" /></div>
     <header className="reader-topbar"><a className="reader-back" href="/" data-testid="link-back-library"><ArrowLeft size={17} /><span>Library</span></a><Brand /><ThemePicker theme={theme} onChange={setTheme} options={readerThemes} /></header>
    {loading ? <div className="reader-loading"><div className="reader-cover-skeleton" /><div><div className="skeleton-line short" /><div className="skeleton-line" /></div></div>
      : error || !book ? <div className="reader-state"><span className="eyebrow">OPEN SHELF</span><h1>Book not found</h1><p>{error || 'This book could not be loaded.'}</p><a href="/" className="button-primary">Return to the library <ArrowRight size={16} /></a></div>
        : <><section className="reader-heading"><div className="reader-book-cover">{book.cover_url ? <img src={book.cover_url} alt={`${book.title} cover`} /> : <BookOpen size={38} />}</div><div className="reader-book-copy"><span className="eyebrow">NOW READING</span><h1>{book.title || 'Untitled'}</h1><p>{book.author || 'Unknown author'}{book.genre ? ` · ${book.genre}` : ''}</p></div></section>
          <div className="reader-tools">
            <div className="reader-control-group"><button id="fontDecrease" type="button" onClick={() => setFontSize((size) => Math.max(12, size - 1))} aria-label="Decrease font size" data-testid="button-font-decrease">A−</button><button id="fontReset" type="button" onClick={() => setFontSize(18)} aria-label="Reset font size" data-testid="button-font-reset">A</button><button id="fontIncrease" type="button" onClick={() => setFontSize((size) => Math.min(34, size + 1))} aria-label="Increase font size" data-testid="button-font-increase">A+</button></div>
            <button id="highlightButton" type="button" onClick={highlightSelection} data-testid="button-highlight">Highlight</button>
            <a id="openOriginal" href={book.book_url} target="_blank" rel="noopener noreferrer" data-testid="link-open-original">Open original <ArrowRight size={13} /></a>
          </div>
          <input ref={musicFileInputRef} className="reader-music-file-input" type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.opus,.flac,.aac,.webm" onChange={handleMusicFile} aria-label="Choose a music file" data-testid="input-reader-music" />
          <audio ref={musicAudioRef} preload="none" onPlay={() => setMusicPlaying(true)} onPause={() => setMusicPlaying(false)} onError={() => { if (musicFileName) { setMusicPlaying(false); setMusicStatus('This file could not be played. Try another audio file.'); } }} />
          <section className="reader-music-panel" aria-label="Personal reading music">
            <span className="reader-music-icon"><Music2 size={20} /></span>
            <div className="reader-music-copy"><span className="eyebrow">YOUR SOUNDTRACK</span><strong title={musicFileName || undefined}>{musicFileName || 'Bring your own sound'}</strong><small role={musicStatus ? 'status' : undefined}>{musicStatus || (musicFileName ? 'Playing from this device · loops while you read' : 'Choose an audio file from this device. It stays private.')}</small></div>
            <div className="reader-music-controls">
              <button type="button" className="reader-music-primary" onClick={() => { if (musicFileName) void toggleMusic(); else musicFileInputRef.current?.click(); }} data-testid="button-reader-music">
                {musicFileName ? musicPlaying ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Play</> : <><Upload size={15} /> Add your music</>}
              </button>
              {musicFileName && <>
                <button type="button" className="reader-music-icon-button" onClick={() => musicFileInputRef.current?.click()} aria-label="Replace music file" title="Replace music" data-testid="button-replace-music"><Upload size={15} /></button>
                <label className="reader-volume" aria-label="Music volume"><Volume2 size={15} /><input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={changeMusicVolume} aria-label="Music volume" data-testid="input-music-volume" /></label>
                <button type="button" className="reader-music-icon-button" onClick={removeMusic} aria-label="Remove music file" title="Remove music" data-testid="button-remove-music"><X size={15} /></button>
              </>}
            </div>
          </section>
          {message && <p className="reader-status" role="status" data-testid="status-reader">{message}</p>}
          <section className="reader-content-shell"><div className="reading-progress"><div className="reading-progress-bar" /></div><div ref={contentRef} className="reader-content" style={{ fontSize: `${fontSize}px`, '--reader-font-size': `${fontSize}px` } as CSSProperties}>{displayedFile || (message ? <div className="reader-file-error">The book could not be opened.</div> : <p className="loading-message">Loading book…</p>)}</div></section>
          <CommunityReviews bookId={String(book.id)} />
        </>}
    <footer className="reader-footer"><Brand /><span>Developed by Nikender Singh</span><a href="/">Back to the shelves <ArrowRight size={14} /></a></footer>
  </main>;
}

async function loadExternalScript(src: string) {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing?.dataset.loaded === 'true') return;
  if (existing) {
    await new Promise<void>((resolve, reject) => { existing.addEventListener('load', () => resolve(), { once: true }); existing.addEventListener('error', () => reject(new Error('Reader library did not load.')), { once: true }); });
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = () => reject(new Error('Reader library did not load.'));
    document.head.appendChild(script);
  });
}

function applyEpubTheme(rendition: any, theme: string) {
  const colors: Record<string, { text: string; background: string }> = {
    light: { text: '#222222', background: '#ffffff' },
    cozy: { text: '#3b2d20', background: '#fff7e9' },
    cafe: { text: '#332b27', background: '#faf5ee' },
    editorial: { text: '#17241e', background: '#faf9f4' },
    dark: { text: '#eeeae2', background: '#272727' },
    gallery: { text: '#eeece7', background: '#202020' },
  };
  const palette = colors[theme] || colors.light;
  rendition.themes.register('openshelf-theme', { body: { color: `${palette.text} !important`, background: `${palette.background} !important` } });
  rendition.themes.select('openshelf-theme');
}

function rtfToPlainText(rtf: string) {
  return rtf.replace(/\\'[0-9a-fA-F]{2}/g, (match) => String.fromCharCode(parseInt(match.slice(2), 16)))
    .replace(/\\par[d]?/g, '\n').replace(/\\line/g, '\n').replace(/\\tab/g, '\t')
    .replace(/\\u(-?\d+)\??/g, (_match, number: string) => String.fromCharCode(Number(number) < 0 ? Number(number) + 65536 : Number(number)))
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '').replace(/[{}]/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function NotFound() {
  return <div className="reader-state"><span className="eyebrow">OPEN SHELF</span><h1>We’ve lost this page.</h1><p>Head back to the neighborhood shelves and find another story.</p><a href="/" className="button-primary">Back to OpenShelf <ArrowRight size={16} /></a></div>;
}

function App() {
  return <Switch><Route path="/" component={LibraryPage} /><Route path="/reader.html" component={ReaderPage} /><Route component={NotFound} /></Switch>;
}

export default App;
