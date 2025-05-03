// 'use client';

// import { useState, useEffect, useCallback, useRef } from 'react';
// import { useDropzone } from 'react-dropzone';
// import Papa from 'papaparse';
// import Image from 'next/image';
// import { motion, AnimatePresence } from 'framer-motion';
// import JSZip from 'jszip';

// interface Metadata {
//   imageName: string;
//   title: string | null;
//   keywords: string[] | null;
//   status: 'pending' | 'success' | 'failed';
//   previewUrl: string;
//   selected: boolean;
//   filter: 'none' | 'grayscale' | 'sepia';
// }

// interface ExportHistory {
//   timestamp: string;
//   format: 'csv' | 'json';
//   count: number;
// }

// interface Toast {
//   id: number;
//   message: string;
// }

// const keywords = [
//   'nature', 'technology', 'business', 'abstract', 'landscape', 'portrait', 'modern', 'creative', 'urban', 'rural',
//   'art', 'design', 'colorful', 'minimal', 'professional', 'office', 'home', 'travel', 'adventure', 'culture',
//   'food', 'health', 'fitness', 'lifestyle', 'fashion', 'beauty', 'people', 'family', 'team', 'collaboration',
//   'innovation', 'future', 'environment', 'sustainability', 'energy', 'water', 'sky', 'forest', 'mountain', 'ocean',
//   'city', 'architecture', 'transport', 'vehicle', 'animal', 'plant', 'texture', 'pattern', 'light', 'shadow',
//   'emotion', 'inspiration', 'success', 'growth', 'diversity'
// ];

// export default function Home() {
//   const [files, setFiles] = useState<File[]>([]);
//   const [metadata, setMetadata] = useState<Metadata[]>([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [error, setError] = useState<string | null>(null);
//   const [suffix, setSuffix] = useState<string>('.Generated with AI');
//   const [customPrompt, setCustomPrompt] = useState<string>(
//     'Analyze this image and generate a title and a list of keywords suitable for uploading to Adobe Stock. The title should be a concise, sales-driven description incorporating some of these keywords: ' +
//     keywords.join(', ') +
//     '. The keywords should be relevant tags that describe the content, style, and details. Provide the response in JSON format: {"title": "the title", "keywords": ["keyword1", "keyword2", ...]}'
//   );
//   const [theme, setTheme] = useState<'light' | 'dark'>('light');
//   const [accentColor, setAccentColor] = useState<string>('#3B82F6');
//   const [csvPreview, setCsvPreview] = useState<string>('');
//   const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
//   const [avgProcessTime, setAvgProcessTime] = useState<number | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchFilter, setSearchFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
//   const [keywordFilter, setKeywordFilter] = useState<string>('');
//   const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
//   const [toasts, setToasts] = useState<Toast[]>([]);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const startTimeRef = useRef<number | null>(null);
//   let toastId = 0;

//   const addToast = (message: string) => {
//     setToasts((prev) => [...prev, { id: toastId++, message }]);
//     setTimeout(() => {
//       setToasts((prev) => prev.filter((toast) => toast.id !== toastId - 1));
//     }, 3000);
//   };

//   useEffect(() => {
//     const savedMetadata = localStorage.getItem('metadata');
//     const savedTheme = localStorage.getItem('theme');
//     const savedAccentColor = localStorage.getItem('accentColor');
//     const savedExportHistory = localStorage.getItem('exportHistory');
//     if (savedMetadata) {
//       const parsedMetadata = JSON.parse(savedMetadata) as Metadata[];
//       setMetadata(parsedMetadata.map(m => ({
//         ...m,
//         selected: m.selected || false,
//         filter: m.filter || 'none',
//         previewUrl: m.previewUrl || URL.createObjectURL(new File([], m.imageName))
//       })));
//       setFiles(parsedMetadata.map(m => new File([], m.imageName)));
//     }
//     if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
//     if (savedAccentColor) setAccentColor(savedAccentColor);
//     if (savedExportHistory) setExportHistory(JSON.parse(savedExportHistory));
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('metadata', JSON.stringify(metadata));
//     localStorage.setItem('theme', theme);
//     localStorage.setItem('accentColor', accentColor);
//     localStorage.setItem('exportHistory', JSON.stringify(exportHistory));
//     document.body.className = theme === 'dark' ? 'dark' : '';
//   }, [metadata, theme, accentColor, exportHistory]);

//   const compressImage = async (file: File): Promise<File> => {
//     const img = document.createElement('img');
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d')!;
//     return new Promise((resolve) => {
//       img.onload = () => {
//         canvas.width = img.width * 0.5;
//         canvas.height = img.height * 0.5;
//         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//         canvas.toBlob((blob) => {
//           resolve(new File([blob!], file.name, { type: file.type }));
//         }, file.type, 0.7);
//       };
//       img.src = URL.createObjectURL(file);
//     });
//   };

//   const { getRootProps, getInputProps } = useDropzone({
//     accept: { 'image/*': [] },
//     maxFiles: 500,
//     onDrop: async (acceptedFiles: File[]) => {
//       if (acceptedFiles.length > 500) {
//         setError('Cannot upload more than 500 images at once.');
//         addToast('Upload limit exceeded! Max 500 images.');
//         return;
//       }
//       const compressedFiles = await Promise.all(acceptedFiles.map(compressImage));
//       const newMetadata = compressedFiles.map((file) => ({
//         imageName: file.name,
//         title: null,
//         keywords: null,
//         status: 'pending' as const,
//         previewUrl: URL.createObjectURL(file),
//         selected: false,
//         filter: 'none' as const,
//       }));
//       setFiles(compressedFiles);
//       setMetadata(newMetadata);
//       setProgress(0);
//       setError(null);
//       addToast('Images uploaded successfully!');
//     },
//   });

//   const readFileAsBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => resolve(reader.result!.toString().split(',')[1]);
//       reader.onerror = reject;
//       reader.readAsDataURL(file);
//     });
//   };

//   const capitalizeWords = (str: string) => {
//     return str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
//   };

//   const applyFilter = (index: number, filter: 'none' | 'grayscale' | 'sepia') => {
//     setMetadata((prev) => {
//       const newMetadata = [...prev];
//       newMetadata[index] = { ...newMetadata[index], filter };
//       return newMetadata;
//     });
//   };

//   const processImages = async () => {
//     setIsProcessing(true);
//     setError(null);
//     startTimeRef.current = performance.now();
//     try {
//       const chunkSize = 3;
//       for (let i = 0; i < files.length; i += chunkSize) {
//         const chunk = files.slice(i, i + chunkSize);
//         const promises = chunk.map(async (file, index) => {
//           try {
//             const base64 = await readFileAsBase64(file);
//             const response = await fetch('/api/generate-metadata', {
//               method: 'POST',
//               body: JSON.stringify({ image: base64, prompt: customPrompt }),
//               headers: { 'Content-Type': 'application/json' },
//             });
//             const data = await response.json();
//             if (data.error) throw new Error(data.error);
//             const { title, keywords } = data;
//             setMetadata((prev) => {
//               const newMetadata = [...prev];
//               newMetadata[i + index] = {
//                 ...newMetadata[i + index],
//                 title: title ? `${capitalizeWords(title)}${suffix}` : null,
//                 keywords: keywords || null,
//                 status: 'success',
//               };
//               return newMetadata;
//             });
//           } catch (err) {
//             setMetadata((prev) => {
//               const newMetadata = [...prev];
//               newMetadata[i + index] = { ...newMetadata[i + index], status: 'failed' };
//               return newMetadata;
//             });
//             console.error(`Failed to process ${file.name}:`, err);
//           }
//         });

//         await Promise.all(promises);
//         const newProgress = Math.min(((i + chunkSize) / files.length) * 100, 100);
//         setProgress(newProgress);
//         if (newProgress === 100) addToast('Processing complete!');
//       }
//       const endTime = performance.now();
//       const totalTime = (endTime - (startTimeRef.current || endTime)) / 1000;
//       setAvgProcessTime(totalTime / files.length);
//     } catch (err: any) {
//       setError(`Processing failed: ${err.message}`);
//       addToast('Processing failed!');
//       console.error('Processing error:', err);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const downloadExport = async () => {
//     const exportData = metadata.map((item) => ({
//       imageName: item.imageName,
//       title: item.title,
//       keywords: item.keywords?.join(','),
//       status: item.status,
//     }));
//     let exportContent;
//     if (exportFormat === 'csv') {
//       exportContent = Papa.unparse(exportData);
//       setCsvPreview(exportContent);
//     } else {
//       exportContent = JSON.stringify(exportData, null, 2);
//       setCsvPreview(exportContent);
//     }

//     const zip = new JSZip();
//     exportData.forEach((item, index) => {
//       const file = files[index];
//       if (file && item.status === 'success') {
//         zip.file(item.imageName, file);
//       }
//     });
//     zip.file(`metadata.${exportFormat}`, exportContent);

//     const zipBlob = await zip.generateAsync({ type: 'blob' });
//     const url = URL.createObjectURL(zipBlob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'metadata_bundle.zip';
//     a.click();
//     URL.revokeObjectURL(url);

//     setExportHistory((prev) => [
//       ...prev,
//       {
//         timestamp: new Date().toISOString(),
//         format: exportFormat,
//         count: exportData.length,
//       },
//     ]);
//     addToast('Export downloaded successfully!');
//   };

//   const updateMetadata = (index: number, field: 'title' | 'keywords', value: string | string[]) => {
//     setMetadata((prev) => {
//       const newMetadata = [...prev];
//       if (field === 'title') {
//         newMetadata[index] = {
//           ...newMetadata[index],
//           title: `${capitalizeWords(value as string)}${suffix}`,
//         };
//       } else {
//         newMetadata[index] = {
//           ...newMetadata[index],
//           keywords: typeof value === 'string' ? value.split(',') : value,
//         };
//       }
//       return newMetadata;
//     });
//   };

//   const suggestKeywords = (title: string) => {
//     const lowerTitle = title.toLowerCase();
//     return keywords.filter(k => lowerTitle.includes(k.toLowerCase())).slice(0, 5);
//   };

//   const autoCompleteKeywords = (input: string, suggestions: string[]) => {
//     const inputWords = input.toLowerCase().split(',');
//     const lastWord = inputWords[inputWords.length - 1].trim();
//     const match = suggestions.find(s => s.toLowerCase().startsWith(lastWord));
//     if (match) {
//       inputWords[inputWords.length - 1] = match;
//       return inputWords.join(',');
//     }
//     return input;
//   };

//   const validateMetadata = (title: string, keywords: string[]) => {
//     return title.length >= 5 && keywords.length >= 3;
//   };

//   const toggleSelect = (index: number) => {
//     setMetadata((prev) => {
//       const newMetadata = [...prev];
//       newMetadata[index] = { ...newMetadata[index], selected: !newMetadata[index].selected };
//       return newMetadata;
//     });
//   };

//   const deleteSelected = () => {
//     const selectedIndices = metadata.reduce((acc, _, idx) => (metadata[idx].selected ? [...acc, idx] : acc), [] as number[]);
//     if (selectedIndices.length > 0) {
//       setFiles(files.filter((_, idx) => !selectedIndices.includes(idx)));
//       setMetadata(metadata.filter((_, idx) => !selectedIndices.includes(idx)));
//       addToast('Selected items deleted!');
//     }
//   };

//   const filteredMetadata = metadata.filter(item => {
//     const matchesSearch = item.imageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
//     const matchesStatus = searchFilter === 'all' || item.status === searchFilter;
//     const matchesKeyword = keywordFilter === '' || (item.keywords?.some(k => k.toLowerCase().includes(keywordFilter.toLowerCase())) || false);
//     return matchesSearch && matchesStatus && matchesKeyword;
//   });

//   return (
//     <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex`}>
//       {/* Sidebar */}
//       <motion.div
//         className="fixed top-0 left-0 h-full bg-gradient-to-b from-gray-800 to-gray-900 text-white p-6 shadow-lg z-50"
//         initial={{ x: -300 }}
//         animate={{ x: isSidebarOpen ? 0 : -300 }}
//         transition={{ duration: 0.3 }}
//       >
//         <button
//           onClick={() => setIsSidebarOpen(false)}
//           className="absolute top-4 right-4 text-white hover:text-gray-300"
//         >
//           ✕
//         </button>
//         <h2 className="text-2xl font-bold mb-6">Settings</h2>
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-2">Theme</label>
//           <select
//             value={theme}
//             onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
//             className="block w-full p-2 bg-gray-700 rounded-md"
//           >
//             <option value="light">Light</option>
//             <option value="dark">Dark</option>
//           </select>
//         </div>
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-2">Accent Color</label>
//           <input
//             type="color"
//             value={accentColor}
//             onChange={(e) => setAccentColor(e.target.value)}
//             className="w-full h-10 rounded-md"
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-2">Title Suffix</label>
//           <select
//             value={suffix}
//             onChange={(e) => setSuffix(e.target.value)}
//             className="block w-full p-2 bg-gray-700 rounded-md"
//           >
//             <option value=".Generated with AI">.Generated with AI</option>
//             <option value=".Created with AI">.Created with AI</option>
//             <option value=".Generated by AI">.Generated by AI</option>
//             <option value=".Created by AI">.Created by AI</option>
//             <option value=".Powered by AI">.Powered by AI</option>
//             <option value=".Made with AI">.Made with AI</option>
//             <option value=".Built with AI">.Built with AI</option>
//           </select>
//         </div>
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-2">Custom Prompt</label>
//           <textarea
//             value={customPrompt}
//             onChange={(e) => setCustomPrompt(e.target.value)}
//             className="block w-full p-2 bg-gray-700 rounded-md"
//             rows={4}
//           />
//         </div>
//       </motion.div>

//       {/* Main Content */}
//       <div className="flex-1 p-6">
//         <button
//           onClick={() => setIsSidebarOpen(true)}
//           className="fixed top-4 left-4 text-2xl text-white bg-gray-800 p-2 rounded-full shadow-lg z-40"
//         >
//           ☰
//         </button>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="max-w-5xl mx-auto"
//         >
//           <h1 className="text-4xl font-bold mb-6" style={{ color: accentColor }}>
//             Metadata Magic for Adobe Stock
//           </h1>

//           <div
//             {...getRootProps()}
//             className="border-2 border-dashed p-8 text-center mb-6 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300"
//           >
//             <input {...getInputProps()} />
//             <p className="text-lg">
//               Drag and drop images here, or click to select (up to 500 images)
//             </p>
//           </div>

//           {error && (
//             <motion.p
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               className="text-red-500 mb-4 text-center bg-red-100 p-3 rounded-xl dark:bg-red-900 dark:text-red-200 shadow-sm"
//             >
//               {error}
//             </motion.p>
//           )}

//           {/* Search and Filters */}
//           <div className="flex flex-wrap gap-4 mb-6">
//             <input
//               type="text"
//               placeholder="Search by name or title..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="flex-1 p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             />
//             <select
//               value={searchFilter}
//               onChange={(e) => setSearchFilter(e.target.value as 'all' | 'pending' | 'success' | 'failed')}
//               className="p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-600 shadow-sm"
//             >
//               <option value="all">All Statuses</option>
//               <option value="pending">Pending</option>
//               <option value="success">Success</option>
//               <option value="failed">Failed</option>
//             </select>
//             <input
//               type="text"
//               placeholder="Filter by keyword..."
//               value={keywordFilter}
//               onChange={(e) => setKeywordFilter(e.target.value)}
//               className="p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             />
//           </div>

//           {files.length > 0 && (
//             <div>
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={processImages}
//                 disabled={isProcessing}
//                 className={`w-full p-4 mb-6 rounded-xl text-white shadow-lg transition-colors duration-300 ${
//                   isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'hover:opacity-90'
//                 }`}
//                 style={{ backgroundColor: accentColor }}
//               >
//                 {isProcessing ? 'Processing...' : 'Generate Metadata'}
//               </motion.button>

//               {isProcessing && (
//                 <motion.div
//                   initial={{ width: 0 }}
//                   animate={{ width: `${progress}%` }}
//                   transition={{ duration: 0.3 }}
//                   className="mb-6"
//                 >
//                   <p className="text-lg">Progress: {progress.toFixed(2)}%</p>
//                   <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-600 shadow-inner">
//                     <motion.div
//                       className="h-full rounded-full"
//                       style={{ backgroundColor: accentColor }}
//                     />
//                   </div>
//                 </motion.div>
//               )}

//               {avgProcessTime && (
//                 <p className="text-lg mb-6">
//                   Avg Processing Time: {avgProcessTime.toFixed(2)}s per image
//                 </p>
//               )}

//               <AnimatePresence>
//                 {filteredMetadata.length > 0 && (
//                   <motion.ul
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     exit={{ opacity: 0 }}
//                     className="space-y-6"
//                   >
//                     {filteredMetadata.map((item, index) => {
//                       const suggestedKeywords = item.title ? suggestKeywords(item.title) : [];
//                       const isValid = validateMetadata(item.title || '', item.keywords || []);

//                       return (
//                         <motion.li
//                           key={index}
//                           initial={{ opacity: 0, y: 20 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0, y: -20 }}
//                           className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
//                         >
//                           <div className="flex items-start space-x-6">
//                             <div className="relative">
//                               <Image
//                                 src={item.previewUrl}
//                                 alt={item.imageName}
//                                 width={120}
//                                 height={120}
//                                 className={`object-cover rounded-lg ${item.filter === 'grayscale' ? 'grayscale' : item.filter === 'sepia' ? 'sepia' : ''}`}
//                               />
//                               <div className="absolute top-2 left-2 flex space-x-2">
//                                 <button
//                                   onClick={() => applyFilter(index, 'none')}
//                                   className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
//                                 >
//                                   None
//                                 </button>
//                                 <button
//                                   onClick={() => applyFilter(index, 'grayscale')}
//                                   className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
//                                 >
//                                   Grayscale
//                                 </button>
//                                 <button
//                                   onClick={() => applyFilter(index, 'sepia')}
//                                   className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
//                                 >
//                                   Sepia
//                                 </button>
//                               </div>
//                             </div>
//                             <div className="flex-1">
//                               <div className="flex justify-between items-center mb-2">
//                                 <p className="text-xl font-semibold">{item.imageName}</p>
//                                 <input
//                                   type="checkbox"
//                                   checked={item.selected}
//                                   onChange={() => toggleSelect(index)}
//                                   className="ml-2"
//                                 />
//                               </div>
//                               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Status: {item.status}</p>
//                               <div className="mb-4">
//                                 <label className="block text-sm font-medium">Title</label>
//                                 <input
//                                   type="text"
//                                   value={item.title?.replace(suffix, '') || ''}
//                                   onChange={(e) => updateMetadata(index, 'title', e.target.value)}
//                                   className={`block w-full p-3 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 ${
//                                     !isValid && item.title ? 'border-red-500' : 'border-gray-300'
//                                   } focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
//                                   disabled={item.status !== 'success'}
//                                 />
//                                 {suggestedKeywords.length > 0 && (
//                                   <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
//                                     Suggested Keywords: {suggestedKeywords.join(', ')}
//                                   </p>
//                                 )}
//                                 {!isValid && item.title && (
//                                   <p className="text-red-500 text-sm mt-2">
//                                     Title must be at least 5 characters.
//                                   </p>
//                                 )}
//                               </div>
//                               <div>
//                                 <label className="block text-sm font-medium">Keywords</label>
//                                 <input
//                                   type="text"
//                                   value={item.keywords?.join(',') || ''}
//                                   onChange={(e) => {
//                                     const autoCompleted = autoCompleteKeywords(e.target.value, suggestedKeywords);
//                                     updateMetadata(index, 'keywords', autoCompleted);
//                                   }}
//                                   className={`block w-full p-3 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 ${
//                                     !isValid && item.keywords ? 'border-red-500' : 'border-gray-300'
//                                   } focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
//                                   disabled={item.status !== 'success'}
//                                 />
//                                 {!isValid && item.keywords && (
//                                   <p className="text-red-500 text-sm mt-2">
//                                     At least 3 keywords required.
//                                   </p>
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         </motion.li>
//                       );
//                     })}
//                   </motion.ul>
//                 )}
//               </AnimatePresence>

//               {filteredMetadata.some((item) => item.status === 'success') && (
//                 <div className="mt-6 space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-2">Export Format</label>
//                     <select
//                       value={exportFormat}
//                       onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
//                       className="block w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 shadow-sm"
//                     >
//                       <option value="csv">CSV</option>
//                       <option value="json">JSON</option>
//                     </select>
//                   </div>
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     onClick={downloadExport}
//                     className="w-full p-4 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors duration-300"
//                   >
//                     Download Bundle
//                   </motion.button>
//                   {csvPreview && (
//                     <motion.div
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       className="mt-4 p-6 bg-gray-100 rounded-xl dark:bg-gray-700 shadow-md"
//                     >
//                       <h3 className="text-lg font-semibold mb-2">Export Preview</h3>
//                       <pre className="overflow-auto max-h-40 text-sm">{csvPreview}</pre>
//                     </motion.div>
//                   )}
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     onClick={deleteSelected}
//                     className="w-full p-4 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors duration-300"
//                     disabled={metadata.every(item => !item.selected)}
//                   >
//                     Delete Selected
//                   </motion.button>
//                 </div>
//               )}

//               {/* Export History */}
//               {exportHistory.length > 0 && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
//                 >
//                   <h3 className="text-xl font-semibold mb-4">Export History</h3>
//                   <ul className="space-y-2">
//                     {exportHistory.map((entry, index) => (
//                       <li key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
//                         Exported {entry.count} items in {entry.format.toUpperCase()} on {new Date(entry.timestamp).toLocaleString()}
//                       </li>
//                     ))}
//                   </ul>
//                 </motion.div>
//               )}

//               {/* Gallery Preview */}
//               <motion.div
//                 className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: 0.2 }}
//               >
//                 {metadata
//                   .filter(item => item.status === 'success')
//                   .map((item, index) => (
//                     <motion.div
//                       key={index}
//                       className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
//                       whileHover={{ scale: 1.05 }}
//                     >
//                       <Image
//                         src={item.previewUrl}
//                         alt={item.title || item.imageName}
//                         width={200}
//                         height={200}
//                         className={`object-cover rounded-lg w-full h-48 ${item.filter === 'grayscale' ? 'grayscale' : item.filter === 'sepia' ? 'sepia' : ''}`}
//                       />
//                       <p className="text-center mt-3 text-lg">{item.title}</p>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </div>
//           )}
//         </motion.div>

//         {/* Toast Notifications */}
//         <div className="fixed bottom-4 right-4 space-y-2 z-50">
//           <AnimatePresence>
//             {toasts.map((toast) => (
//               <motion.div
//                 key={toast.id}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: 20 }}
//                 className="p-4 bg-green-500 text-white rounded-xl shadow-lg"
//               >
//                 {toast.message}
//               </motion.div>
//             ))}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// }



















// 'use client';

// import { useState, useEffect, useCallback, useRef } from 'react';
// import { useDropzone } from 'react-dropzone';
// import Papa from 'papaparse';
// import Image from 'next/image';
// import { motion, AnimatePresence } from 'framer-motion';
// import JSZip from 'jszip';

// interface Metadata {
//   imageName: string;
//   title: string | null;
//   keywords: string[] | null;
//   status: 'pending' | 'success' | 'failed';
//   previewUrl: string;
//   selected: boolean;
//   filter: 'none' | 'grayscale' | 'sepia';
// }

// interface ExportHistory {
//   timestamp: string;
//   format: 'csv' | 'json';
//   count: number;
// }

// interface Toast {
//   id: number;
//   message: string;
// }

// const keywords = [
//   'nature', 'technology', 'business', 'abstract', 'landscape', 'portrait', 'modern', 'creative', 'urban', 'rural',
//   'art', 'design', 'colorful', 'minimal', 'professional', 'office', 'home', 'travel', 'adventure', 'culture',
//   'food', 'health', 'fitness', 'lifestyle', 'fashion', 'beauty', 'people', 'family', 'team', 'collaboration',
//   'innovation', 'future', 'environment', 'sustainability', 'energy', 'water', 'sky', 'forest', 'mountain', 'ocean',
//   'city', 'architecture', 'transport', 'vehicle', 'animal', 'plant', 'texture', 'pattern', 'light', 'shadow',
//   'emotion', 'inspiration', 'success', 'growth', 'diversity'
// ];

// export default function Home() {
//   const [files, setFiles] = useState<File[]>([]);
//   const [metadata, setMetadata] = useState<Metadata[]>([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [error, setError] = useState<string | null>(null);
//   const [suffix, setSuffix] = useState<string>('.generated with AI');
//   const [customPrompt, setCustomPrompt] = useState<string>(
//     'Analyze this image and generate a title and a list of keywords suitable for uploading to Adobe Stock. The title should be a concise, sales-driven description incorporating some of these keywords: ' +
//     keywords.join(', ') +
//     '. The keywords should be relevant tags that describe the content, style, and details. Provide the response in JSON format: {"title": "the title", "keywords": ["keyword1", "keyword2", ...]}'
//   );
//   const [theme, setTheme] = useState<'light' | 'dark'>('light');
//   const [accentColor, setAccentColor] = useState<string>('#3B82F6');
//   const [csvPreview, setCsvPreview] = useState<string>('');
//   const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
//   const [avgProcessTime, setAvgProcessTime] = useState<number | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchFilter, setSearchFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
//   const [keywordFilter, setKeywordFilter] = useState<string>('');
//   const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
//   const [toasts, setToasts] = useState<Toast[]>([]);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const startTimeRef = useRef<number | null>(null);
//   let toastId = 0;

//   const addToast = (message: string) => {
//     setToasts((prev) => [...prev, { id: toastId++, message }]);
//     setTimeout(() => {
//       setToasts((prev) => prev.filter((toast) => toast.id !== toastId - 1));
//     }, 3000);
//   };

//   useEffect(() => {
//     const savedMetadata = localStorage.getItem('metadata');
//     const savedTheme = localStorage.getItem('theme');
//     const savedAccentColor = localStorage.getItem('accentColor');
//     const savedExportHistory = localStorage.getItem('exportHistory');
//     if (savedMetadata) {
//       const parsedMetadata = JSON.parse(savedMetadata) as Metadata[];
//       setMetadata(parsedMetadata.map(m => ({
//         ...m,
//         selected: m.selected || false,
//         filter: m.filter || 'none',
//         previewUrl: m.previewUrl || URL.createObjectURL(new File([], m.imageName))
//       })));
//       setFiles(parsedMetadata.map(m => new File([], m.imageName)));
//     }
//     if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
//     if (savedAccentColor) setAccentColor(savedAccentColor);
//     if (savedExportHistory) setExportHistory(JSON.parse(savedExportHistory));
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('metadata', JSON.stringify(metadata));
//     localStorage.setItem('theme', theme);
//     localStorage.setItem('accentColor', accentColor);
//     localStorage.setItem('exportHistory', JSON.stringify(exportHistory));
//     document.body.className = theme === 'dark' ? 'dark' : '';
//   }, [metadata, theme, accentColor, exportHistory]);

//   const compressImage = async (file: File): Promise<File> => {
//     const img = document.createElement('img');
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d')!;
//     return new Promise((resolve) => {
//       img.onload = () => {
//         canvas.width = img.width * 0.5;
//         canvas.height = img.height * 0.5;
//         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//         canvas.toBlob((blob) => {
//           resolve(new File([blob!], file.name, { type: file.type }));
//         }, file.type, 0.7);
//       };
//       img.src = URL.createObjectURL(file);
//     });
//   };

//   const { getRootProps, getInputProps } = useDropzone({
//     accept: { 'image/*': [] },
//     maxFiles: 500,
//     onDrop: async (acceptedFiles: File[]) => {
//       if (acceptedFiles.length > 500) {
//         setError('Cannot upload more than 500 images at once.');
//         addToast('Upload limit exceeded! Max 500 images.');
//         return;
//       }
//       const compressedFiles = await Promise.all(acceptedFiles.map(compressImage));
//       const newMetadata = compressedFiles.map((file) => ({
//         imageName: file.name,
//         title: null,
//         keywords: null,
//         status: 'pending' as const,
//         previewUrl: URL.createObjectURL(file),
//         selected: false,
//         filter: 'none' as const,
//       }));
//       setFiles(compressedFiles);
//       setMetadata(newMetadata);
//       setProgress(0);
//       setError(null);
//       addToast('Images uploaded successfully!');
//     },
//   });

//   const readFileAsBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => resolve(reader.result!.toString().split(',')[1]);
//       reader.onerror = reject;
//       reader.readAsDataURL(file);
//     });
//   };

//   const capitalizeWords = (str: string) => {
//     return str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
//   };

//   const applyFilter = (index: number, filter: 'none' | 'grayscale' | 'sepia') => {
//     setMetadata((prev) => {
//       const newMetadata = [...prev];
//       newMetadata[index] = { ...newMetadata[index], filter };
//       return newMetadata;
//     });
//   };

//   const processImages = async () => {
//     setIsProcessing(true);
//     setError(null);
//     startTimeRef.current = performance.now();
//     try {
//       const chunkSize = 3;
//       for (let i = 0; i < files.length; i += chunkSize) {
//         const chunk = files.slice(i, i + chunkSize);
//         const promises = chunk.map(async (file, index) => {
//           try {
//             const base64 = await readFileAsBase64(file);
//             const response = await fetch('/api/generate-metadata', {
//               method: 'POST',
//               body: JSON.stringify({ image: base64, prompt: customPrompt }),
//               headers: { 'Content-Type': 'application/json' },
//             });
//             const data = await response.json();
//             if (data.error) throw new Error(data.error);
//             const { title, keywords } = data;
//             setMetadata((prev) => {
//               const newMetadata = [...prev];
//               newMetadata[i + index] = {
//                 ...newMetadata[i + index],
//                 title: title ? `${capitalizeWords(title)}${suffix}` : null,
//                 keywords: keywords || null,
//                 status: 'success',
//               };
//               return newMetadata;
//             });
//           } catch (err) {
//             setMetadata((prev) => {
//               const newMetadata = [...prev];
//               newMetadata[i + index] = { ...newMetadata[i + index], status: 'failed' };
//               return newMetadata;
//             });
//             console.error(`Failed to process ${file.name}:`, err);
//           }
//         });

//         await Promise.all(promises);
//         const newProgress = Math.min(((i + chunkSize) / files.length) * 100, 100);
//         setProgress(newProgress);
//         if (newProgress === 100) addToast('Processing complete!');
//       }
//       const endTime = performance.now();
//       const totalTime = (endTime - (startTimeRef.current || endTime)) / 1000;
//       setAvgProcessTime(totalTime / files.length);
//     } catch (err: any) {
//       setError(`Processing failed: ${err.message}`);
//       addToast('Processing failed!');
//       console.error('Processing error:', err);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const downloadExport = async () => {
//     const exportData = metadata.map((item) => ({
//       imageName: item.imageName,
//       title: item.title,
//       keywords: item.keywords?.join(','),
//       status: item.status,
//     }));
//     let exportContent;
//     if (exportFormat === 'csv') {
//       exportContent = Papa.unparse(exportData);
//       setCsvPreview(exportContent);
//     } else {
//       exportContent = JSON.stringify(exportData, null, 2);
//       setCsvPreview(exportContent);
//     }

//     const zip = new JSZip();
//     exportData.forEach((item, index) => {
//       const file = files[index];
//       if (file && item.status === 'success') {
//         zip.file(item.imageName, file);
//       }
//     });
//     zip.file(`metadata.${exportFormat}`, exportContent);

//     const zipBlob = await zip.generateAsync({ type: 'blob' });
//     const url = URL.createObjectURL(zipBlob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'metadata_bundle.zip';
//     a.click();
//     URL.revokeObjectURL(url);

//     setExportHistory((prev) => [
//       ...prev,
//       {
//         timestamp: new Date().toISOString(),
//         format: exportFormat,
//         count: exportData.length,
//       },
//     ]);
//     addToast('Export downloaded successfully!');
//   };

//   const updateMetadata = (index: number, field: 'title' | 'keywords', value: string | string[]) => {
//     setMetadata((prev) => {
//       const newMetadata = [...prev];
//       if (field === 'title') {
//         newMetadata[index] = {
//           ...newMetadata[index],
//           title: `${capitalizeWords(value as string)}${suffix}`,
//         };
//       } else {
//         newMetadata[index] = {
//           ...newMetadata[index],
//           keywords: typeof value === 'string' ? value.split(',') : value,
//         };
//       }
//       return newMetadata;
//     });
//   };

//   const suggestKeywords = (title: string) => {
//     const lowerTitle = title.toLowerCase();
//     return keywords.filter(k => lowerTitle.includes(k.toLowerCase())).slice(0, 5);
//   };

//   const autoCompleteKeywords = (input: string, suggestions: string[]) => {
//     const inputWords = input.toLowerCase().split(',');
//     const lastWord = inputWords[inputWords.length - 1].trim();
//     const match = suggestions.find(s => s.toLowerCase().startsWith(lastWord));
//     if (match) {
//       inputWords[inputWords.length - 1] = match;
//       return inputWords.join(',');
//     }
//     return input;
//   };

//   const validateMetadata = (title: string, keywords: string[]) => {
//     return title.length >= 5 && keywords.length >= 3;
//   };

//   const toggleSelect = (index: number) => {
//     setMetadata((prev) => {
//       const newMetadata = [...prev];
//       newMetadata[index] = { ...newMetadata[index], selected: !newMetadata[index].selected };
//       return newMetadata;
//     });
//   };

//   const deleteSelected = () => {
//     const selectedIndices = metadata.reduce((acc, _, idx) => (metadata[idx].selected ? [...acc, idx] : acc), [] as number[]);
//     if (selectedIndices.length > 0) {
//       setFiles(files.filter((_, idx) => !selectedIndices.includes(idx)));
//       setMetadata(metadata.filter((_, idx) => !selectedIndices.includes(idx)));
//       addToast('Selected items deleted!');
//     }
//   };

//   const filteredMetadata = metadata.filter(item => {
//     const matchesSearch = item.imageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
//     const matchesStatus = searchFilter === 'all' || item.status === searchFilter;
//     const matchesKeyword = keywordFilter === '' || (item.keywords?.some(k => k.toLowerCase().includes(keywordFilter.toLowerCase())) || false);
//     return matchesSearch && matchesStatus && matchesKeyword;
//   });

//   return (
//     <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex`}>
//       {/* Sidebar */}
//       <motion.div
//         className="fixed top-0 left-0 h-full bg-gradient-to-b from-gray-800 to-gray-900 text-white p-6 shadow-lg z-50"
//         initial={{ x: -300 }}
//         animate={{ x: isSidebarOpen ? 0 : -300 }}
//         transition={{ duration: 0.3 }}
//       >
//         <button
//           onClick={() => setIsSidebarOpen(false)}
//           className="absolute top-4 right-4 text-white hover:text-gray-300"
//         >
//           ✕
//         </button>
//         <h2 className="text-2xl font-bold mb-6">Settings</h2>
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-2">Theme</label>
//           <select
//             value={theme}
//             onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
//             className="block w-full p-2 bg-gray-700 rounded-md"
//           >
//             <option value="light">Light</option>
//             <option value="dark">Dark</option>
//           </select>
//         </div>
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-2">Accent Color</label>
//           <input
//             type="color"
//             value={accentColor}
//             onChange={(e) => setAccentColor(e.target.value)}
//             className="w-full h-10 rounded-md"
//           />
//         </div>
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-2">Title Suffix</label>
//           <select
//             value={suffix}
//             onChange={(e) => setSuffix(e.target.value)}
//             className="block w-full p-2 bg-gray-700 rounded-md"
//           >
//             <option value=".generated with AI">.generated with AI</option>
//             <option value=".created with AI">.created with AI</option>
//             <option value=".powered by AI">.powered by AI</option>
//           </select>
//         </div>
//         <div className="mb-4">
//           <label className="block text-sm font-medium mb-2">Custom Prompt</label>
//           <textarea
//             value={customPrompt}
//             onChange={(e) => setCustomPrompt(e.target.value)}
//             className="block w-full p-2 bg-gray-700 rounded-md"
//             rows={4}
//           />
//         </div>
//       </motion.div>

//       {/* Main Content */}
//       <div className="flex-1 p-6">
//         <button
//           onClick={() => setIsSidebarOpen(true)}
//           className="fixed top-4 left-4 text-2xl text-white bg-gray-800 p-2 rounded-full shadow-lg z-40"
//         >
//           ☰
//         </button>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="max-w-5xl mx-auto"
//         >
//           <h1 className="text-4xl font-bold mb-6" style={{ color: accentColor }}>
//             Metadata Magic for Adobe Stock
//           </h1>

//           <div
//             {...getRootProps()}
//             className="border-2 border-dashed p-8 text-center mb-6 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-md hover:shadow-lg transition-shadow duration-300"
//           >
//             <input {...getInputProps()} />
//             <p className="text-lg">
//               Drag and drop images here, or click to select (up to 500 images)
//             </p>
//           </div>

//           {error && (
//             <motion.p
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               className="text-red-500 mb-4 text-center bg-red-100 p-3 rounded-xl dark:bg-red-900 dark:text-red-200 shadow-sm"
//             >
//               {error}
//             </motion.p>
//           )}

//           {/* Search and Filters */}
//           <div className="flex flex-wrap gap-4 mb-6">
//             <input
//               type="text"
//               placeholder="Search by name or title..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="flex-1 p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             />
//             <select
//               value={searchFilter}
//               onChange={(e) => setSearchFilter(e.target.value as 'all' | 'pending' | 'success' | 'failed')}
//               className="p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-600 shadow-sm"
//             >
//               <option value="all">All Statuses</option>
//               <option value="pending">Pending</option>
//               <option value="success">Success</option>
//               <option value="failed">Failed</option>
//             </select>
//             <input
//               type="text"
//               placeholder="Filter by keyword..."
//               value={keywordFilter}
//               onChange={(e) => setKeywordFilter(e.target.value)}
//               className="p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             />
//           </div>

//           {files.length > 0 && (
//             <div>
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={processImages}
//                 disabled={isProcessing}
//                 className={`w-full p-4 mb-6 rounded-xl text-white shadow-lg transition-colors duration-300 ${
//                   isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'hover:opacity-90'
//                 }`}
//                 style={{ backgroundColor: accentColor }}
//               >
//                 {isProcessing ? 'Processing...' : 'Generate Metadata'}
//               </motion.button>

//               {isProcessing && (
//                 <motion.div
//                   initial={{ width: 0 }}
//                   animate={{ width: `${progress}%` }}
//                   transition={{ duration: 0.3 }}
//                   className="mb-6"
//                 >
//                   <p className="text-lg">Progress: {progress.toFixed(2)}%</p>
//                   <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-600 shadow-inner">
//                     <motion.div
//                       className="h-full rounded-full"
//                       style={{ backgroundColor: accentColor }}
//                     />
//                   </div>
//                 </motion.div>
//               )}

//               {avgProcessTime && (
//                 <p className="text-lg mb-6">
//                   Avg Processing Time: {avgProcessTime.toFixed(2)}s per image
//                 </p>
//               )}

//               <AnimatePresence>
//                 {filteredMetadata.length > 0 && (
//                   <motion.ul
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     exit={{ opacity: 0 }}
//                     className="space-y-6"
//                   >
//                     {filteredMetadata.map((item, index) => {
//                       const suggestedKeywords = item.title ? suggestKeywords(item.title) : [];
//                       const isValid = validateMetadata(item.title || '', item.keywords || []);

//                       return (
//                         <motion.li
//                           key={index}
//                           initial={{ opacity: 0, y: 20 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0, y: -20 }}
//                           className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
//                         >
//                           <div className="flex items-start space-x-6">
//                             <div className="relative">
//                               <Image
//                                 src={item.previewUrl}
//                                 alt={item.imageName}
//                                 width={120}
//                                 height={120}
//                                 className={`object-cover rounded-lg ${item.filter === 'grayscale' ? 'grayscale' : item.filter === 'sepia' ? 'sepia' : ''}`}
//                               />
//                               <div className="absolute top-2 left-2 flex space-x-2">
//                                 <button
//                                   onClick={() => applyFilter(index, 'none')}
//                                   className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
//                                 >
//                                   None
//                                 </button>
//                                 <button
//                                   onClick={() => applyFilter(index, 'grayscale')}
//                                   className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
//                                 >
//                                   Grayscale
//                                 </button>
//                                 <button
//                                   onClick={() => applyFilter(index, 'sepia')}
//                                   className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
//                                 >
//                                   Sepia
//                                 </button>
//                               </div>
//                             </div>
//                             <div className="flex-1">
//                               <div className="flex justify-between items-center mb-2">
//                                 <p className="text-xl font-semibold">{item.imageName}</p>
//                                 <input
//                                   type="checkbox"
//                                   checked={item.selected}
//                                   onChange={() => toggleSelect(index)}
//                                   className="ml-2"
//                                 />
//                               </div>
//                               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Status: {item.status}</p>
//                               <div className="mb-4">
//                                 <label className="block text-sm font-medium">Title</label>
//                                 <input
//                                   type="text"
//                                   value={item.title?.replace(suffix, '') || ''}
//                                   onChange={(e) => updateMetadata(index, 'title', e.target.value)}
//                                   className={`block w-full p-3 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 ${
//                                     !isValid && item.title ? 'border-red-500' : 'border-gray-300'
//                                   } focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
//                                   disabled={item.status !== 'success'}
//                                 />
//                                 {suggestedKeywords.length > 0 && (
//                                   <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
//                                     Suggested Keywords: {suggestedKeywords.join(', ')}
//                                   </p>
//                                 )}
//                                 {!isValid && item.title && (
//                                   <p className="text-red-500 text-sm mt-2">
//                                     Title must be at least 5 characters.
//                                   </p>
//                                 )}
//                               </div>
//                               <div>
//                                 <label className="block text-sm font-medium">Keywords</label>
//                                 <input
//                                   type="text"
//                                   value={item.keywords?.join(',') || ''}
//                                   onChange={(e) => {
//                                     const autoCompleted = autoCompleteKeywords(e.target.value, suggestedKeywords);
//                                     updateMetadata(index, 'keywords', autoCompleted);
//                                   }}
//                                   className={`block w-full p-3 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 ${
//                                     !isValid && item.keywords ? 'border-red-500' : 'border-gray-300'
//                                   } focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
//                                   disabled={item.status !== 'success'}
//                                 />
//                                 {!isValid && item.keywords && (
//                                   <p className="text-red-500 text-sm mt-2">
//                                     At least 3 keywords required.
//                                   </p>
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         </motion.li>
//                       );
//                     })}
//                   </motion.ul>
//                 )}
//               </AnimatePresence>

//               {filteredMetadata.some((item) => item.status === 'success') && (
//                 <div className="mt-6 space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-2">Export Format</label>
//                     <select
//                       value={exportFormat}
//                       onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
//                       className="block w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 shadow-sm"
//                     >
//                       <option value="csv">CSV</option>
//                       <option value="json">JSON</option>
//                     </select>
//                   </div>
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     onClick={downloadExport}
//                     className="w-full p-4 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors duration-300"
//                   >
//                     Download Bundle
//                   </motion.button>
//                   {csvPreview && (
//                     <motion.div
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       className="mt-4 p-6 bg-gray-100 rounded-xl dark:bg-gray-700 shadow-md"
//                     >
//                       <h3 className="text-lg font-semibold mb-2">Export Preview</h3>
//                       <pre className="overflow-auto max-h-40 text-sm">{csvPreview}</pre>
//                     </motion.div>
//                   )}
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     onClick={deleteSelected}
//                     className="w-full p-4 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors duration-300"
//                     disabled={metadata.every(item => !item.selected)}
//                   >
//                     Delete Selected
//                   </motion.button>
//                 </div>
//               )}

//               {/* Export History */}
//               {exportHistory.length > 0 && (
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md"
//                 >
//                   <h3 className="text-xl font-semibold mb-4">Export History</h3>
//                   <ul className="space-y-2">
//                     {exportHistory.map((entry, index) => (
//                       <li key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
//                         Exported {entry.count} items in {entry.format.toUpperCase()} on {new Date(entry.timestamp).toLocaleString()}
//                       </li>
//                     ))}
//                   </ul>
//                 </motion.div>
//               )}

//               {/* Gallery Preview */}
//               <motion.div
//                 className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: 0.2 }}
//               >
//                 {metadata
//                   .filter(item => item.status === 'success')
//                   .map((item, index) => (
//                     <motion.div
//                       key={index}
//                       className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
//                       whileHover={{ scale: 1.05 }}
//                     >
//                       <Image
//                         src={item.previewUrl}
//                         alt={item.title || item.imageName}
//                         width={200}
//                         height={200}
//                         className={`object-cover rounded-lg w-full h-48 ${item.filter === 'grayscale' ? 'grayscale' : item.filter === 'sepia' ? 'sepia' : ''}`}
//                       />
//                       <p className="text-center mt-3 text-lg">{item.title}</p>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </div>
//           )}
//         </motion.div>

//         {/* Toast Notifications */}
//         <div className="fixed bottom-4 right-4 space-y-2 z-50">
//           <AnimatePresence>
//             {toasts.map((toast) => (
//               <motion.div
//                 key={toast.id}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: 20 }}
//                 className="p-4 bg-green-500 text-white rounded-xl shadow-lg"
//               >
//                 {toast.message}
//               </motion.div>
//             ))}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// }




































'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';

interface Metadata {
  imageName: string;
  title: string | null;
  keywords: string[] | null;
  status: 'pending' | 'success' | 'failed';
  previewUrl: string;
  selected: boolean;
}

const keywords = [
  'nature', 'technology', 'business', 'abstract', 'landscape', 'portrait', 'modern', 'creative', 'urban', 'rural',
  'art', 'design', 'colorful', 'minimal', 'professional', 'office', 'home', 'travel', 'adventure', 'culture',
  'food', 'health', 'fitness', 'lifestyle', 'fashion', 'beauty', 'people', 'family', 'team', 'collaboration',
  'innovation', 'future', 'environment', 'sustainability', 'energy', 'water', 'sky', 'forest', 'mountain', 'ocean',
  'city', 'architecture', 'transport', 'vehicle', 'animal', 'plant', 'texture', 'pattern', 'light', 'shadow',
  'emotion', 'inspiration', 'success', 'growth', 'diversity'
];

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<Metadata[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [suffix, setSuffix] = useState<string>('.Generated with AI');
  
  const [customPrompt, setCustomPrompt] = useState<string>(
    'Analyze this image and generate a title and a list of keywords suitable for uploading to Adobe Stock. The title should be a concise, sales-driven description incorporating some of these keywords: ' +
    keywords.join(', ') +
    '. The keywords should be relevant tags that describe the content, style, and details. Provide the response in JSON format: {"title": "the title", "keywords": ["keyword1", "keyword2", ...]}'
  );
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [avgProcessTime, setAvgProcessTime] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const savedMetadata = localStorage.getItem('metadata');
    const savedTheme = localStorage.getItem('theme');
    if (savedMetadata) {
      const parsedMetadata = JSON.parse(savedMetadata) as Metadata[];
      setMetadata(parsedMetadata.map(m => ({
        ...m,
        selected: m.selected || false,
        previewUrl: m.previewUrl || URL.createObjectURL(new File([], m.imageName))
      })));
      setFiles(parsedMetadata.map(m => new File([], m.imageName)));
    }
    if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('metadata', JSON.stringify(metadata));
    localStorage.setItem('theme', theme);
    document.body.className = theme === 'dark' ? 'dark' : '';
  }, [metadata, theme]);

  const compressImage = async (file: File): Promise<File> => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width * 0.5;
        canvas.height = img.height * 0.5;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name, { type: file.type }));
        }, file.type, 0.7);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 500,
    onDrop: async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 500) {
        setError('Cannot upload more than 500 images at once.');
        return;
      }
      const compressedFiles = await Promise.all(acceptedFiles.map(compressImage));
      const newMetadata = compressedFiles.map((file) => ({
        imageName: file.name,
        title: null,
        keywords: null,
        status: 'pending' as const,
        previewUrl: URL.createObjectURL(file),
        selected: false,
      }));
      setFiles(compressedFiles);
      setMetadata(newMetadata);
      setProgress(0);
      setError(null);
    },
  });

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result!.toString().split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
  };

  const processImages = async () => {
    setIsProcessing(true);
    setError(null);
    startTimeRef.current = performance.now();
    try {
      const chunkSize = 3;
      for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = files.slice(i, i + chunkSize);
        const promises = chunk.map(async (file, index) => {
          try {
            const base64 = await readFileAsBase64(file);
            const response = await fetch('/api/generate-metadata', {
              method: 'POST',
              body: JSON.stringify({ image: base64, prompt: customPrompt }),
              headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            const { title, keywords } = data;
            setMetadata((prev) => {
              const newMetadata = [...prev];
              newMetadata[i + index] = {
                ...newMetadata[i + index],
                title: title ? `${capitalizeWords(title)}${suffix}` : null,
                keywords: keywords || null,
                status: 'success',
              };
              return newMetadata;
            });
          } catch (err) {
            setMetadata((prev) => {
              const newMetadata = [...prev];
              newMetadata[i + index] = { ...newMetadata[i + index], status: 'failed' };
              return newMetadata;
            });
            console.error(`Failed to process ${file.name}:`, err);
          }
        });

        await Promise.all(promises);
        setProgress(Math.min(((i + chunkSize) / files.length) * 100, 100));
      }
      const endTime = performance.now();
      const totalTime = (endTime - (startTimeRef.current || endTime)) / 1000;
      setAvgProcessTime(totalTime / files.length);
    } catch (err: any) {
      setError(`Processing failed: ${err.message}`);
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExport = async () => {
    const exportData = metadata.map((item) => ({
      imageName: item.imageName,
      title: item.title,
      keywords: item.keywords?.join(','),
      status: item.status,
    }));
    let exportContent;
    if (exportFormat === 'csv') {
      exportContent = Papa.unparse(exportData);
      setCsvPreview(exportContent);
    } else {
      exportContent = JSON.stringify(exportData, null, 2);
      setCsvPreview(exportContent);
    }

    const zip = new JSZip();
    exportData.forEach((item, index) => {
      const file = files[index];
      if (file && item.status === 'success') {
        zip.file(item.imageName, file);
      }
    });
    zip.file(`metadata.${exportFormat}`, exportContent);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'metadata_bundle.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateMetadata = (index: number, field: 'title' | 'keywords', value: string | string[]) => {
    setMetadata((prev) => {
      const newMetadata = [...prev];
      if (field === 'title') {
        newMetadata[index] = {
          ...newMetadata[index],
          title: `${capitalizeWords(value as string)}${suffix}`,
        };
      } else {
        newMetadata[index] = {
          ...newMetadata[index],
          keywords: typeof value === 'string' ? value.split(',') : value,
        };
      }
      return newMetadata;
    });
  };

  const suggestKeywords = (title: string) => {
    const lowerTitle = title.toLowerCase();
    return keywords.filter(k => lowerTitle.includes(k.toLowerCase())).slice(0, 5);
  };

  const autoCompleteKeywords = (input: string, suggestions: string[]) => {
    const inputWords = input.toLowerCase().split(',');
    const lastWord = inputWords[inputWords.length - 1].trim();
    const match = suggestions.find(s => s.toLowerCase().startsWith(lastWord));
    if (match) {
      inputWords[inputWords.length - 1] = match;
      return inputWords.join(',');
    }
    return input;
  };

  const validateMetadata = (title: string, keywords: string[]) => {
    return title.length >= 5 && keywords.length >= 3;
  };

  const toggleSelect = (index: number) => {
    setMetadata((prev) => {
      const newMetadata = [...prev];
      newMetadata[index] = { ...newMetadata[index], selected: !newMetadata[index].selected };
      return newMetadata;
    });
  };

  const deleteSelected = () => {
    const selectedIndices = metadata.reduce((acc, _, idx) => (metadata[idx].selected ? [...acc, idx] : acc), [] as number[]);
    if (selectedIndices.length > 0) {
      setFiles(files.filter((_, idx) => !selectedIndices.includes(idx)));
      setMetadata(metadata.filter((_, idx) => !selectedIndices.includes(idx)));
    }
  };

  const filteredMetadata = metadata.filter(item =>
    item.imageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            I T Boy  Metadata Generator for Adobe Stock
          </h1>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 p-6 text-center mb-6 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 cursor-pointer"
        >
          <input {...getInputProps()} />
          <p className="text-gray-600 dark:text-gray-300">
            Drag and drop images here, or click to select (up to 500 images)
          </p>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded dark:bg-red-900 dark:text-red-200"
          >
            {error}
          </motion.p>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title Suffix
          </label>
          <select
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          >
            <option value=".Generated with AI">.Generated with AI</option>
            <option value=".Created with AI">.Created with AI</option>
            <option value=".Generated by AI">.powered by AI</option>
            <option value=".Created by AI">.Created by AI</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom Prompt
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            rows={4}
          />
        </div>

        <input
          type="text"
          placeholder="Search by name or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-6 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />

        {files.length > 0 && (
          <div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={processImages}
              disabled={isProcessing}
              className={`w-full p-3 mb-4 rounded-md text-white ${
                isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Generate Metadata'}
            </motion.button>

            {isProcessing && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <p className="text-gray-600 dark:text-gray-300">Progress: {progress.toFixed(2)}%</p>
                <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-600">
                  <motion.div
                    className="h-full bg-blue-600 dark:bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </motion.div>
            )}

            {avgProcessTime && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Avg Processing Time: {avgProcessTime.toFixed(2)}s per image
              </p>
            )}

            <AnimatePresence>
              {filteredMetadata.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {filteredMetadata.map((item, index) => {
                    const suggestedKeywords = item.title ? suggestKeywords(item.title) : [];
                    const isValid = validateMetadata(item.title || '', item.keywords || []);

                    return (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="border-b pb-4 dark:border-gray-700"
                      >
                        <div className="flex items-start space-x-4">
                          <Image
                            src={item.previewUrl}
                            alt={item.imageName}
                            width={100}
                            height={100}
                            className="object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold">{item.imageName}</p>
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleSelect(index)}
                                className="ml-2"
                              />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Status: {item.status}</p>
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                              <input
                                type="text"
                                value={item.title?.replace(suffix, '') || ''}
                                onChange={(e) => updateMetadata(index, 'title', e.target.value)}
                                className={`block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                                  !isValid && item.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={item.status !== 'success'}
                              />
                              {suggestedKeywords.length > 0 && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  Suggested Keywords: {suggestedKeywords.join(', ')}
                                </p>
                              )}
                              {!isValid && item.title && (
                                <p className="text-red-500 text-sm mt-1">
                                  Title must be at least 5 characters.
                                </p>
                              )}
                            </div>
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Keywords</label>
                              <input
                                type="text"
                                value={item.keywords?.join(',') || ''}
                                onChange={(e) => {
                                  const autoCompleted = autoCompleteKeywords(e.target.value, suggestedKeywords);
                                  updateMetadata(index, 'keywords', autoCompleted);
                                }}
                                className={`block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                                  !isValid && item.keywords ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={item.status !== 'success'}
                              />
                              {!isValid && item.keywords && (
                                <p className="text-red-500 text-sm mt-1">
                                  At least 3 keywords required.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>

            {filteredMetadata.some((item) => item.status === 'success') && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                    className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadExport}
                  className="w-full p-3 mt-4 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                >
                  Download Bundle
                </motion.button>
                {csvPreview && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-gray-100 rounded-md dark:bg-gray-700"
                  >
                    <h3 className="text-lg font-semibold mb-2">Export Preview</h3>
                    <pre className="overflow-auto max-h-40 text-sm">{csvPreview}</pre>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deleteSelected}
                  className="w-full p-3 mt-4 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  disabled={metadata.every(item => !item.selected)}
                >
                  Delete Selected
                </motion.button>
              </div>
            )}

            <motion.div
              className="mt-6 grid grid-cols-3 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {metadata
                .filter(item => item.status === 'success')
                .map((item, index) => (
                  <motion.div
                    key={index}
                    className="bg-gray-200 p-2 rounded dark:bg-gray-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Image
                      src={item.previewUrl}
                      alt={item.title || item.imageName}
                      width={150}
                      height={150}
                      className="object-cover rounded"
                    />
                    <p className="text-center mt-2">{item.title}</p>
                  </motion.div>
                ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// 'use client';

// import { useState, useEffect, useCallback, useRef } from 'react';
// import { useDropzone } from 'react-dropzone';
// import Papa from 'papaparse';
// import Image from 'next/image';

// interface Metadata {
//   imageName: string;
//   title: string | null;
//   keywords: string[] | null;
//   status: 'pending' | 'success' | 'failed';
//   previewUrl: string;
// }

// const keywords = [
//   'nature', 'technology', 'business', 'abstract', 'landscape', 'portrait', 'modern', 'creative', 'urban', 'rural',
//   'art', 'design', 'colorful', 'minimal', 'professional', 'office', 'home', 'travel', 'adventure', 'culture',
//   'food', 'health', 'fitness', 'lifestyle', 'fashion', 'beauty', 'people', 'family', 'team', 'collaboration',
//   'innovation', 'future', 'environment', 'sustainability', 'energy', 'water', 'sky', 'forest', 'mountain', 'ocean',
//   'city', 'architecture', 'transport', 'vehicle', 'animal', 'plant', 'texture', 'pattern', 'light', 'shadow',
//   'emotion', 'inspiration', 'success', 'growth', 'diversity'
// ];

// export default function Home() {
//   const [files, setFiles] = useState<File[]>([]);
//   const [metadata, setMetadata] = useState<Metadata[]>([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [error, setError] = useState<string | null>(null);
//   const [suffix, setSuffix] = useState<string>('.generated with AI');
//   const [customPrompt, setCustomPrompt] = useState<string>(
//     'Analyze this image and generate a title and a list of keywords suitable for uploading to Adobe Stock. The title should be a concise, sales-driven description incorporating some of these keywords: ' +
//     keywords.join(', ') +
//     '. The keywords should be relevant tags that describe the content, style, and details. Provide the response in JSON format: {"title": "the title", "keywords": ["keyword1", "keyword2", ...]}'
//   );
//   const [theme, setTheme] = useState<'light' | 'dark'>('light');
//   const [csvPreview, setCsvPreview] = useState<string>('');
//   const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
//   const [avgProcessTime, setAvgProcessTime] = useState<number | null>(null);
//   const startTimeRef = useRef<number | null>(null);

//   useEffect(() => {
//     const savedMetadata = localStorage.getItem('metadata');
//     const savedTheme = localStorage.getItem('theme');
//     if (savedMetadata) {
//       const parsedMetadata = JSON.parse(savedMetadata);
//       setMetadata(parsedMetadata);
//       setFiles(parsedMetadata.map((m: Metadata) => new File([], m.imageName)));
//     }
//     if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('metadata', JSON.stringify(metadata));
//     localStorage.setItem('theme', theme);
//     document.body.className = theme === 'dark' ? 'dark' : '';
//   }, [metadata, theme]);

//   const compressImage = async (file: File): Promise<File> => {
//     const img = document.createElement('img');
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d')!;
//     return new Promise((resolve) => {
//       img.onload = () => {
//         canvas.width = img.width * 0.5;
//         canvas.height = img.height * 0.5;
//         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//         canvas.toBlob((blob) => {
//           resolve(new File([blob!], file.name, { type: file.type }));
//         }, file.type, 0.7);
//       };
//       img.src = URL.createObjectURL(file);
//     });
//   };

//   const { getRootProps, getInputProps } = useDropzone({
//     accept: { 'image/*': [] },
//     maxFiles: 500,
//     onDrop: async (acceptedFiles: File[]) => {
//       if (acceptedFiles.length > 500) {
//         setError('Cannot upload more than 500 images at once.');
//         return;
//       }
//       const compressedFiles = await Promise.all(acceptedFiles.map(compressImage));
//       const newMetadata = compressedFiles.map((file) => ({
//         imageName: file.name,
//         title: null,
//         keywords: null,
//         status: 'pending' as const,
//         previewUrl: URL.createObjectURL(file),
//       }));
//       setFiles(compressedFiles);
//       setMetadata(newMetadata);
//       setProgress(0);
//       setError(null);
//     },
//   });

//   const readFileAsBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => resolve(reader.result!.toString().split(',')[1]);
//       reader.onerror = reject;
//       reader.readAsDataURL(file);
//     });
//   };

//   const capitalizeWords = (str: string) => {
//     return str.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
//   };

//   const processImages = async () => {
//     setIsProcessing(true);
//     setError(null);
//     startTimeRef.current = performance.now();
//     try {
//       const chunkSize = 3;
//       for (let i = 0; i < files.length; i += chunkSize) {
//         const chunk = files.slice(i, i + chunkSize);
//         const promises = chunk.map(async (file, index) => {
//           try {
//             const base64 = await readFileAsBase64(file);
//             const response = await fetch('/api/generate-metadata', {
//               method: 'POST',
//               body: JSON.stringify({ image: base64, prompt: customPrompt }),
//               headers: { 'Content-Type': 'application/json' },
//             });
//             const data = await response.json();
//             if (data.error) throw new Error(data.error);
//             const { title, keywords } = data;
//             setMetadata((prev) => {
//               const newMetadata = [...prev];
//               newMetadata[i + index] = {
//                 ...newMetadata[i + index],
//                 title: title ? `${capitalizeWords(title)}${suffix}` : null,
//                 keywords,
//                 status: 'success',
//               };
//               return newMetadata;
//             });
//           } catch (err) {
//             setMetadata((prev) => {
//               const newMetadata = [...prev];
//               newMetadata[i + index] = { ...newMetadata[i + index], status: 'failed' };
//               return newMetadata;
//             });
//             console.error(`Failed to process ${file.name}:`, err);
//           }
//         });

//         await Promise.all(promises);
//         setProgress(Math.min(((i + chunkSize) / files.length) * 100, 100));
//       }
//       const endTime = performance.now();
//       const totalTime = (endTime - (startTimeRef.current || endTime)) / 1000;
//       setAvgProcessTime(totalTime / files.length);
//     } catch (err: any) {
//       setError(`Processing failed: ${err.message}`);
//       console.error('Processing error:', err);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const downloadExport = () => {
//     const exportData = metadata.map((item) => ({
//       image: item.imageName,
//       title: item.title,
//       keywords: item.keywords?.join(','),
//       status: item.status,
//     }));
//     let exportContent;
//     if (exportFormat === 'csv') {
//       exportContent = Papa.unparse(exportData);
//       setCsvPreview(exportContent);
//       const blob = new Blob([exportContent], { type: 'text/csv' });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'metadata.csv';
//       a.click();
//       URL.revokeObjectURL(url);
//     } else {
//       exportContent = JSON.stringify(exportData, null, 2);
//       setCsvPreview(exportContent);
//       const blob = new Blob([exportContent], { type: 'application/json' });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'metadata.json';
//       a.click();
//       URL.revokeObjectURL(url);
//     }
//   };

//   const updateMetadata = (index: number, field: 'title' | 'keywords', value: string | string[]) => {
//     setMetadata((prev) => {
//       const newMetadata = [...prev];
//       if (field === 'title') {
//         newMetadata[index] = {
//           ...newMetadata[index],
//           title: `${capitalizeWords(value as string)}${suffix}`,
//         };
//       } else {
//         newMetadata[index] = {
//           ...newMetadata[index],
//           keywords: typeof value === 'string' ? value.split(',') : value,
//         };
//       }
//       return newMetadata;
//     });
//   };

//   const suggestKeywords = (title: string) => {
//     const lowerTitle = title.toLowerCase();
//     return keywords.filter(k => lowerTitle.includes(k.toLowerCase())).slice(0, 5);
//   };

//   const autoCompleteKeywords = (input: string, suggestions: string[]) => {
//     const inputWords = input.toLowerCase().split(',');
//     const lastWord = inputWords[inputWords.length - 1].trim();
//     const match = suggestions.find(s => s.toLowerCase().startsWith(lastWord));
//     if (match) {
//       inputWords[inputWords.length - 1] = match;
//       return inputWords.join(',');
//     }
//     return input;
//   };

//   const validateMetadata = (title: string, keywords: string[]) => {
//     return title.length >= 5 && keywords.length >= 3;
//   };

//   return (
//     <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
//       <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
//             IT's Metadata Generator for Adobe Stock
//           </h1>
//           <button
//             onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
//             className="p-2 bg-gray-200 dark:bg-gray-700 rounded"
//           >
//             Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
//           </button>
//         </div>
//         <div
//           {...getRootProps()}
//           className="border-2 border-dashed border-gray-300 p-6 text-center mb-6 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 cursor-pointer"
//         >
//           <input {...getInputProps()} />
//           <p className="text-gray-600 dark:text-gray-300">
//             Drag and drop images here, or click to select (up to 500 images)
//           </p>
//         </div>

//         {error && (
//           <p className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded dark:bg-red-900 dark:text-red-200">{error}</p>
//         )}

//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//             Title Suffix
//           </label>
//           <select
//             value={suffix}
//             onChange={(e) => setSuffix(e.target.value)}
//             className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
//           >
//             <option value=".generated with AI">.generated with AI</option>
//             <option value=".created with AI">.created with AI</option>
//             <option value=".generated with AI">.generated with AI</option>
//           </select>
//         </div>

//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//             Custom Prompt
//           </label>
//           <textarea
//             value={customPrompt}
//             onChange={(e) => setCustomPrompt(e.target.value)}
//             className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
//             rows={4}
//           />
//         </div>

//         {files.length > 0 && (
//           <div>
//             <button
//               onClick={processImages}
//               disabled={isProcessing}
//               className={`w-full p-3 mb-4 rounded-md text-white ${
//                 isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
//               }`}
//             >
//               {isProcessing ? 'Processing...' : 'Generate Metadata'}
//             </button>

//             {isProcessing && (
//               <div className="mb-6">
//                 <p className="text-gray-600 dark:text-gray-300">Progress: {progress.toFixed(2)}%</p>
//                 <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-600">
//                   <div
//                     className="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-500"
//                     style={{ width: `${progress}%` }}
//                   />
//                 </div>
//               </div>
//             )}

//             {avgProcessTime && (
//               <p className="text-gray-600 dark:text-gray-300 mb-4">
//                 Avg Processing Time: {avgProcessTime.toFixed(2)}s per image
//               </p>
//             )}

//             <ul className="space-y-4">
//               {metadata.map((item, index) => {
//                 const suggestedKeywords = item.title ? suggestKeywords(item.title) : [];
//                 const isValid = validateMetadata(item.title || '', item.keywords || []);

//                 return (
//                   <li key={index} className="border-b pb-4 dark:border-gray-700">
//                     <div className="flex items-start space-x-4">
//                       <Image
//                         src={item.previewUrl}
//                         alt={item.imageName}
//                         width={100}
//                         height={100}
//                         className="object-cover rounded-md"
//                       />
//                       <div className="flex-1">
//                         <p className="font-semibold">{item.imageName}</p>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Status: {item.status}</p>
//                         <div className="mt-2">
//                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
//                           <input
//                             type="text"
//                             value={item.title?.replace(suffix, '') || ''}
//                             onChange={(e) => updateMetadata(index, 'title', e.target.value)}
//                             className={`block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
//                               !isValid && item.title ? 'border-red-500' : 'border-gray-300'
//                             }`}
//                             disabled={item.status !== 'success'}
//                           />
//                           {suggestedKeywords.length > 0 && (
//                             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                               Suggested Keywords: {suggestedKeywords.join(', ')}
//                             </p>
//                           )}
//                         </div>
//                         <div className="mt-2">
//                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Keywords</label>
//                           <input
//                             type="text"
//                             value={item.keywords?.join(',') || ''}
//                             onChange={(e) => {
//                               const autoCompleted = autoCompleteKeywords(e.target.value, suggestedKeywords);
//                               updateMetadata(index, 'keywords', autoCompleted);
//                             }}
//                             className={`block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
//                               !isValid && item.keywords ? 'border-red-500' : 'border-gray-300'
//                             }`}
//                             disabled={item.status !== 'success'}
//                           />
//                         </div>
//                         {!isValid && item.status === 'success' && (
//                           <p className="text-red-500 text-sm mt-1">
//                             Title must be at least 5 characters, and keywords at least 3.
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </li>
//                 );
//               })}
//             </ul>

//             {metadata.some((item) => item.status === 'success') && (
//               <div>
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                     Export Format
//                   </label>
//                   <select
//                     value={exportFormat}
//                     onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
//                     className="block w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
//                   >
//                     <option value="csv">CSV</option>
//                     <option value="json">JSON</option>
//                   </select>
//                 </div>
//                 <button
//                   onClick={downloadExport}
//                   className="w-full p-3 mt-4 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
//                 >
//                   Download {exportFormat.toUpperCase()}
//                 </button>
//                 {csvPreview && (
//                   <div className="mt-4 p-4 bg-gray-100 rounded-md dark:bg-gray-700">
//                     <h3 className="text-lg font-semibold mb-2">Export Preview</h3>
//                     <pre className="overflow-auto max-h-40 text-sm">{csvPreview}</pre>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }








// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { useDropzone } from 'react-dropzone';
// import Papa from 'papaparse';
// import Image from 'next/image';

// interface Metadata {
//   imageName: string;
//   title: string | null;
//   keywords: string[] | null;
//   status: 'pending' | 'success' | 'failed';
//   previewUrl: string;
// }

// const keywords = [
//   'nature', 'technology', 'business', 'abstract', 'landscape', 'portrait', 'modern', 'creative', 'urban', 'rural',
//   'art', 'design', 'colorful', 'minimal', 'professional', 'office', 'home', 'travel', 'adventure', 'culture',
//   'food', 'health', 'fitness', 'lifestyle', 'fashion', 'beauty', 'people', 'family', 'team', 'collaboration',
//   'innovation', 'future', 'environment', 'sustainability', 'energy', 'water', 'sky', 'forest', 'mountain', 'ocean',
//   'city', 'architecture', 'transport', 'vehicle', 'animal', 'plant', 'texture', 'pattern', 'light', 'shadow',
//   'emotion', 'inspiration', 'success', 'growth', 'diversity'
// ];

// export default function Home() {
//   const [files, setFiles] = useState<File[]>([]);
//   const [metadata, setMetadata] = useState<Metadata[]>([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [error, setError] = useState<string | null>(null);
//   const [suffix, setSuffix] = useState<string>('.generated with AI');
//   const [customPrompt, setCustomPrompt] = useState<string>(
//     'Analyze this image and generate a title and a list of keywords suitable for uploading to Adobe Stock. The title should be a concise, sales-driven description incorporating some of these keywords: ' +
//     keywords.join(', ') +
//     '. The keywords should be relevant tags that describe the content, style, and details. Provide the response in JSON format: {"title": "the title", "keywords": ["keyword1", "keyword2", ...]}'
//   );

//   // Load saved state from localStorage
//   useEffect(() => {
//     const savedMetadata = localStorage.getItem('metadata');
//     const savedFiles = localStorage.getItem('files');
//     if (savedMetadata) {
//       const parsedMetadata = JSON.parse(savedMetadata);
//       setMetadata(parsedMetadata);
//       setFiles(parsedMetadata.map((m: Metadata) => new File([], m.imageName)));
//     }
//     if (savedFiles) {
//       // Note: Files can't be fully restored due to security, so we rely on metadata
//     }
//   }, []);

//   // Save state to localStorage
//   useEffect(() => {
//     localStorage.setItem('metadata', JSON.stringify(metadata));
//   }, [metadata]);

//   const compressImage = async (file: File): Promise<File> => {
//     const img = document.createElement('img');
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d')!;
//     return new Promise((resolve) => {
//       img.onload = () => {
//         canvas.width = img.width * 0.5;
//         canvas.height = img.height * 0.5;
//         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//         canvas.toBlob((blob) => {
//           resolve(new File([blob!], file.name, { type: file.type }));
//         }, file.type, 0.7);
//       };
//       img.src = URL.createObjectURL(file);
//     });
//   };

//   const { getRootProps, getInputProps } = useDropzone({
//     accept: { 'image/*': [] },
//     maxFiles: 500,
//     onDrop: async (acceptedFiles: File[]) => {
//       if (acceptedFiles.length > 500) {
//         setError('Cannot upload more than 500 images at once.');
//         return;
//       }
//       const compressedFiles = await Promise.all(acceptedFiles.map(compressImage));
//       const newMetadata = compressedFiles.map((file) => ({
//         imageName: file.name,
//         title: null,
//         keywords: null,
//         status: 'pending' as const,
//         previewUrl: URL.createObjectURL(file),
//       }));
//       setFiles(compressedFiles);
//       setMetadata(newMetadata);
//       setProgress(0);
//       setError(null);
//     },
//   });

//   const readFileAsBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => resolve(reader.result!.toString().split(',')[1]);
//       reader.onerror = reject;
//       reader.readAsDataURL(file);
//     });
//   };

//   const processImages = async () => {
//     setIsProcessing(true);
//     setError(null);
//     try {
//       const chunkSize = 3; // Smaller chunks for better performance
//       for (let i = 0; i < files.length; i += chunkSize) {
//         const chunk = files.slice(i, i + chunkSize);
//         const promises = chunk.map(async (file, index) => {
//           try {
//             const base64 = await readFileAsBase64(file);
//             const response = await fetch('/api/generate-metadata', {
//               method: 'POST',
//               body: JSON.stringify({ image: base64, prompt: customPrompt }),
//               headers: { 'Content-Type': 'application/json' },
//             });
//             const data = await response.json();
//             if (data.error) throw new Error(data.error);
//             const { title, keywords } = data;
//             setMetadata((prev) => {
//               const newMetadata = [...prev];
//               newMetadata[i + index] = {
//                 ...newMetadata[i + index],
//                 title: `${title}${suffix}`,
//                 keywords,
//                 status: 'success',
//               };
//               return newMetadata;
//             });
//           } catch (err) {
//             setMetadata((prev) => {
//               const newMetadata = [...prev];
//               newMetadata[i + index] = { ...newMetadata[i + index], status: 'failed' };
//               return newMetadata;
//             });
//             console.error(`Failed to process ${file.name}:`, err);
//           }
//         });

//         await Promise.all(promises);
//         setProgress(Math.min(((i + chunkSize) / files.length) * 100, 100));
//       }
//     } catch (err: any) {
//       setError(`Processing failed: ${err.message}`);
//       console.error('Processing error:', err);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const downloadCSV = () => {
//     const csvData = metadata.map((item) => ({
//       image: item.imageName,
//       title: item.title,
//       keywords: item.keywords?.join(','),
//       status: item.status,
//     }));
//     const csv = Papa.unparse(csvData);
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'metadata.csv';
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const updateMetadata = (index: number, field: 'title' | 'keywords', value: string | string[]) => {
//     setMetadata((prev) => {
//       const newMetadata = [...prev];
//       if (field === 'title') {
//         newMetadata[index] = { ...newMetadata[index], title: `${value}${suffix}` };
//       } else {
//         newMetadata[index] = { ...newMetadata[index], keywords: typeof value === 'string' ? value.split(',') : value };
//       }
//       return newMetadata;
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">
//       <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
//         <h1 className="text-4xl font-bold text-center text-blue-600 mb-4">
//           IT's Metadata Generator for Adobe Stock
//         </h1>
//         <div
//           {...getRootProps()}
//           className="border-2 border-dashed border-gray-300 p-6 text-center mb-6 rounded-lg hover:bg-gray-50 cursor-pointer"
//         >
//           <input {...getInputProps()} />
//           <p className="text-gray-600">
//             Drag and drop images here, or click to select (up to 500 images)
//           </p>
//         </div>

//         {error && (
//           <p className="text-red-500 mb-4 text-center bg-red-100 p-2 rounded">{error}</p>
//         )}

//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Title Suffix
//           </label>
//           <select
//             value={suffix}
//             onChange={(e) => setSuffix(e.target.value)}
//             className="block w-full p-2 border rounded-md"
//           >
//             <option value=".generated with AI">.generated with AI</option>
//             <option value=".created with AI">.created with AI</option>
//             <option value=".powered by AI">.powered by AI</option>
//           </select>
//         </div>

//         <div className="mb-6">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Custom Prompt
//           </label>
//           <textarea
//             value={customPrompt}
//             onChange={(e) => setCustomPrompt(e.target.value)}
//             className="block w-full p-2 border rounded-md"
//             rows={4}
//           />
//         </div>

//         {files.length > 0 && (
//           <div>
//             <button
//               onClick={processImages}
//               disabled={isProcessing}
//               className={`w-full p-3 mb-4 rounded-md text-white ${
//                 isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
//               }`}
//             >
//               {isProcessing ? 'Processing...' : 'Generate Metadata'}
//             </button>

//             {isProcessing && (
//               <div className="mb-6">
//                 <p className="text-gray-600">Progress: {progress.toFixed(2)}%</p>
//                 <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden">
//                   <div
//                     className="h-full bg-blue-600 transition-all duration-300"
//                     style={{ width: `${progress}%` }}
//                   />
//                 </div>
//               </div>
//             )}

//             <ul className="space-y-4">
//               {metadata.map((item, index) => (
//                 <li key={index} className="border-b pb-4">
//                   <div className="flex items-start space-x-4">
//                     <Image
//                       src={item.previewUrl}
//                       alt={item.imageName}
//                       width={100}
//                       height={100}
//                       className="object-cover rounded-md"
//                     />
//                     <div className="flex-1">
//                       <p className="font-semibold">{item.imageName}</p>
//                       <p className="text-sm text-gray-500">Status: {item.status}</p>
//                       <div className="mt-2">
//                         <label className="block text-sm font-medium text-gray-700">Title</label>
//                         <input
//                           type="text"
//                           value={item.title?.replace(suffix, '') || ''}
//                           onChange={(e) => updateMetadata(index, 'title', e.target.value)}
//                           className="block w-full p-2 mt-1 border rounded-md"
//                           disabled={item.status !== 'success'}
//                         />
//                       </div>
//                       <div className="mt-2">
//                         <label className="block text-sm font-medium text-gray-700">Keywords</label>
//                         <input
//                           type="text"
//                           value={item.keywords?.join(',') || ''}
//                           onChange={(e) => updateMetadata(index, 'keywords', e.target.value)}
//                           className="block w-full p-2 mt-1 border rounded-md"
//                           disabled={item.status !== 'success'}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </li>
//               ))}
//             </ul>

//             {metadata.some((item) => item.status === 'success') && (
//               <button
//                 onClick={downloadCSV}
//                 className="w-full p-3 mt-4 bg-green-600 text-white rounded-md hover:bg-green-700"
//               >
//                 Download CSV
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }















// 'use client';

// import { useState } from 'react';
// import { useDropzone } from 'react-dropzone';
// import Papa from 'papaparse';

// interface Metadata {
//   imageName: string;
//   title: string | null;
//   keywords: string[] | null;
// }

// export default function Home() {
//   const [files, setFiles] = useState<File[]>([]);
//   const [metadata, setMetadata] = useState<Metadata[]>([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [error, setError] = useState<string | null>(null);

//   const { getRootProps, getInputProps } = useDropzone({
//     accept: { 'image/*': [] },
//     onDrop: (acceptedFiles: File[]) => {
//       setFiles(acceptedFiles);
//       setMetadata(acceptedFiles.map((file) => ({ imageName: file.name, title: null, keywords: null })));
//       setProgress(0);
//       setError(null);
//     },
//   });

//   const readFileAsBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => resolve(reader.result!.toString().split(',')[1]);
//       reader.onerror = reject;
//       reader.readAsDataURL(file);
//     });
//   };

//   const processImages = async () => {
//     setIsProcessing(true);
//     setError(null);
//     try {
//       const prompt =
//         'Analyze this image and generate a title and a list of keywords suitable for uploading to Adobe Stock. The title should be a concise description of the image, and the keywords should be relevant tags that describe the content, style, and any other pertinent details. Provide the response in JSON format: {"title": "the title", "keywords": ["keyword1", "keyword2", ...]}';
//       const chunkSize = 5;

//       for (let i = 0; i < files.length; i += chunkSize) {
//         const chunk = files.slice(i, i + chunkSize);
//         const promises = chunk.map(async (file, index) => {
//           const base64 = await readFileAsBase64(file);
//           const response = await fetch('/api/generate-metadata', {
//             method: 'POST',
//             body: JSON.stringify({ image: base64, prompt }),
//             headers: { 'Content-Type': 'application/json' },
//           });
//           const data = await response.json();
//           if (data.error) throw new Error(data.error);
//           const { title, keywords } = data;
//           setMetadata((prev) => {
//             const newMetadata = [...prev];
//             newMetadata[i + index] = { imageName: file.name, title, keywords };
//             return newMetadata;
//           });
//         });

//         await Promise.all(promises);
//         setProgress(Math.min(((i + chunkSize) / files.length) * 100, 100));
//       }
//     } catch (err: any) {
//       setError(`Processing failed: ${err.message}`);
//       console.error('Processing error:', err);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const downloadCSV = () => {
//     const csvData = metadata.map((item) => ({
//       image: item.imageName,
//       title: item.title,
//       keywords: item.keywords?.join(','),
//     }));
//     const csv = Papa.unparse(csvData);
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'metadata.csv';
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
//       <h1>Metadata Generator for Adobe Stock</h1>
//       <div
//         {...getRootProps()}
//         style={{
//           border: '2px dashed #ccc',
//           padding: '20px',
//           textAlign: 'center',
//           marginBottom: '20px',
//           cursor: 'pointer',
//         }}
//       >
//         <input {...getInputProps()} />
//         <p>Drag and drop images here, or click to select (up to 500 images)</p>
//       </div>

//       {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

//       {files.length > 0 && (
//         <div>
//           <button
//             onClick={processImages}
//             disabled={isProcessing}
//             style={{
//               padding: '10px 20px',
//               marginBottom: '10px',
//               backgroundColor: isProcessing ? '#ccc' : '#0070f3',
//               color: '#fff',
//               border: 'none',
//               cursor: isProcessing ? 'not-allowed' : 'pointer',
//             }}
//           >
//             {isProcessing ? 'Processing...' : 'Generate Metadata'}
//           </button>

//           {isProcessing && (
//             <div style={{ marginBottom: '20px' }}>
//               <p>Progress: {progress.toFixed(2)}%</p>
//               <div
//                 style={{
//                   width: '100%',
//                   height: '20px',
//                   backgroundColor: '#e0e0e0',
//                   borderRadius: '5px',
//                   overflow: 'hidden',
//                 }}
//               >
//                 <div
//                   style={{
//                     width: `${progress}%`,
//                     height: '100%',
//                     backgroundColor: '#0070f3',
//                     transition: 'width 0.3s ease-in-out',
//                   }}
//                 />
//               </div>
//             </div>
//           )}

//           <ul style={{ listStyle: 'none', padding: 0 }}>
//             {metadata.map((item, index) => (
//               <li
//                 key={index}
//                 style={{
//                   padding: '10px',
//                   borderBottom: '1px solid #eee',
//                   wordBreak: 'break-word',
//                 }}
//               >
//                 <strong>{item.imageName}</strong>:
//                 {item.title
//                   ? ` Title: ${item.title}, Keywords: ${item.keywords?.join(', ')}`
//                   : ' Pending'}
//               </li>
//             ))}
//           </ul>

//           {metadata.every((item) => item.title && item.keywords) && (
//             <button
//               onClick={downloadCSV}
//               style={{
//                 padding: '10px 20px',
//                 backgroundColor: '#28a745',
//                 color: '#fff',
//                 border: 'none',
//                 cursor: 'pointer',
//               }}
//             >
//               Download CSV
//             </button>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }// import Image from "next/image";

// export default function Home() {
//   return (
//     <div>
//       helloe
//     </div>
//   );
// }
