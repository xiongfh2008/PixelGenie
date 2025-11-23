import React, { useState, useEffect, useRef } from 'react';
import { AppMode, AnalysisData, Language, TranslationData, TextBlock } from './types';
import { analyzeImage, modifyImage, translateImageText, fileToBase64, scanForAIMetadata, detectTextAndTranslate } from './services/geminiService';
import { generateELA, generateSobel, generateLNA, generateMFR } from './services/elaService';
import { Button, Card, Badge, Spinner, Slider, SidebarItem, Tooltip, CompareSlider, BrushCanvas, BrushTool, Logo } from './components/Components';
import { UploadArea } from './components/UploadArea';

// --- TRANSLATIONS & CONFIG ---
const TRANSLATIONS: Record<Language, any> = {
  en: {
    title: "PixelGenie AI",
    subtitle: "Forensic & Creative Suite",
    navForensics: "Forensics Lab",
    navForensicsDesc: "Deepfake & ELA Detection",
    navEditor: "AI Editor",
    navEditorDesc: "Remove BG, Enhance, Cutout",
    navTranslator: "Visual Translator",
    navTranslatorDesc: "In-Place Image Translation",
    navLogo: "Logo Generator",
    navLogoDesc: "Text or Sketch to Logo",
    navCompress: "Smart Compressor",
    navCompressDesc: "Local Privacy Compression",
    navDewatermark: "Magic Eraser",
    navDewatermarkDesc: "Remove Watermarks & Objects",
    navAIDetector: "AI Detector",
    navAIDetectorDesc: "Detect AI Generation",
    forensicsTitle: "Forensic Analysis Report",
    fakeSuspected: "⚠️ Manipulation Detected",
    fakeAuthentic: "✅ Authentic Image",
    aiProb: "AI Generated Probability",
    editorTools: "AI Tools",
    toolRemoveBg: "Remove Background",
    toolEnhance: "Enhance / Upscale",
    toolCutout: "Magic Cutout",
    toolPromptPlaceholder: "Describe the edit...",
    transLangLabel: "Translate to:",
    transBtn: "Visual Translate",
    transOrig: "Original Text",
    transResult: "Translated Text",
    transImgResult: "Translated Image",
    compQuality: "Compression Quality",
    compOrigSize: "Original Size",
    compNewSize: "New Size",
    compDownload: "Download Compressed",
    logoPrompt: "Describe your logo concept",
    logoPlaceholder: "Minimalist flat vector logo of a fox, orange gradient...",
    logoBtn: "Generate Logo",
    wmLabel: "Description (Auto Mode)",
    wmPlaceholder: "e.g. 'text at bottom', 'logo in corner'",
    wmBtn: "Remove Selected Area",
    wmDesc: "Use Manual Mode to paint over the watermark, or Auto Mode to describe it.",
    wmModeAuto: "Auto (Text)",
    wmModeManual: "Manual (Brush)",
    aiScanBtn: "Start AI Detection",
    aiScanLocal: "Scanning file metadata...",
    aiScanCloud: "Running deep visual analysis...",
    aiResultPositive: "AI Metadata Found",
    aiResultNegative: "No AI Metadata",
    aiToolDetected: "Generator Detected",
    uploadBtn: "Upload New Image",
    startOver: "New Image",
    compareLabel: "Compare: Original vs Edited",
    downloadBtn: "Download Result",
    newImage: "New Image",
    sourceImage: "Source Image",
    refImage: "Reference Image (Optional)",
    clearRef: "Clear Reference",
    toolBrush: "Brush",
    toolRect: "Rectangle",
    toolLasso: "Lasso",
    toolEraser: "Eraser",
    brushSize: "Size",
    statusGeneratingELA: "Generating Forensic Maps...",
    statusAnalyzingAI: "AI Analyzing Evidence (Flash Mode)...",
    statusProcessing: "Processing Image...",
    tooltipConfidence: "The AI's confidence level in the authenticity verdict based on analyzed features.",
    tooltipAiProb: "Probability that the image was synthesized by Generative AI models.",
    tooltipMethod: "Forensic method applied: "
  },
  zh: {
    title: "PixelGenie AI",
    subtitle: "图像鉴伪与创意工具箱",
    navForensics: "智能鉴伪",
    navForensicsDesc: "Deepfake与篡改检测",
    navEditor: "AI 编辑室",
    navEditorDesc: "去背景、增强、智能抠图",
    navTranslator: "视觉翻译",
    navTranslatorDesc: "图片文字原地翻译",
    navLogo: "Logo 创意",
    navLogoDesc: "草图/文本生成 Logo",
    navCompress: "智能压缩",
    navCompressDesc: "本地隐私无损压缩",
    navDewatermark: "智能去水印",
    navDewatermarkDesc: "擦除水印与物体",
    navAIDetector: "AI 生成检测",
    navAIDetectorDesc: "检测 AIGC 痕迹",
    forensicsTitle: "鉴伪分析报告",
    fakeSuspected: "⚠️ 疑似存在篡改",
    fakeAuthentic: "✅ 图片看似真实",
    aiProb: "AI 生成概率",
    editorTools: "AI 工具箱",
    toolRemoveBg: "一键去背景",
    toolEnhance: "画质增强/超分",
    toolCutout: "智能抠图",
    toolPromptPlaceholder: "描述修改内容...",
    transLangLabel: "翻译目标语言:",
    transBtn: "开始视觉翻译",
    transOrig: "原文提取",
    transResult: "译文内容",
    transImgResult: "视觉翻译结果",
    compQuality: "压缩质量",
    compOrigSize: "原始大小",
    compNewSize: "压缩后",
    compDownload: "下载压缩图",
    logoPrompt: "描述 Logo 创意",
    logoPlaceholder: "极简矢量风格的狐狸 Logo，橙色渐变...",
    logoBtn: "立即生成",
    wmLabel: "水印描述 (自动模式)",
    wmPlaceholder: "例如：'右下角的文字'，'中间的 Logo'",
    wmBtn: "立即擦除",
    wmDesc: "使用手动模式涂抹水印，或自动模式描述水印内容。",
    wmModeAuto: "自动 (描述)",
    wmModeManual: "手动 (涂抹)",
    aiScanBtn: "开始检测",
    aiScanLocal: "扫描文件元数据...",
    aiScanCloud: "执行深度视觉分析...",
    aiResultPositive: "发现 AI 元数据",
    aiResultNegative: "未发现元数据",
    aiToolDetected: "生成工具",
    uploadBtn: "上传新图片",
    startOver: "新图片",
    compareLabel: "对比：原图 vs 效果图",
    downloadBtn: "下载结果",
    newImage: "新图片",
    sourceImage: "原图",
    refImage: "参考图 (可选)",
    clearRef: "清除参考",
    toolBrush: "画笔",
    toolRect: "矩形选框",
    toolLasso: "套索工具",
    toolEraser: "橡皮擦",
    brushSize: "画笔大小",
    statusGeneratingELA: "正在生成 ELA 和 MFR 取证图谱...",
    statusAnalyzingAI: "AI 正在进行快速智能分析...",
    statusProcessing: "正在处理图片...",
    tooltipConfidence: "AI 基于视觉特征对鉴伪结论的置信度。",
    tooltipAiProb: "该图片由生成式 AI 合成的概率估计。",
    tooltipMethod: "应用的取证分析方法："
  },
  es: {
     title: "PixelGenie AI",
     subtitle: "Suite Forense y Creativa",
     navForensics: "Laboratorio Forense",
     navForensicsDesc: "Detección Deepfake y ELA",
     navEditor: "Editor IA",
     navEditorDesc: "Quitar fondo, Mejorar",
     navTranslator: "Traductor Visual",
     navTranslatorDesc: "Traducción en imagen",
     navLogo: "Generador de Logos",
     navLogoDesc: "Boceto a Logo",
     navCompress: "Compresor Inteligente",
     navCompressDesc: "Compresión local privada",
     navDewatermark: "Borrador Mágico",
     navDewatermarkDesc: "Eliminar marcas de agua",
     navAIDetector: "Detector IA",
     navAIDetectorDesc: "Detectar generación IA",
     forensicsTitle: "Informe Forense",
     fakeSuspected: "⚠️ Manipulación Detectada",
     fakeAuthentic: "✅ Imagen Auténtica",
     aiProb: "Probabilidad de IA",
     editorTools: "Herramientas IA",
     toolRemoveBg: "Quitar Fondo",
     toolEnhance: "Mejorar Calidad",
     toolCutout: "Recorte Mágico",
     toolPromptPlaceholder: "Describa la edición...",
     transLangLabel: "Traducir a:",
     transBtn: "Traducir",
     transOrig: "Texto Original",
     transResult: "Texto Traducido",
     transImgResult: "Imagen Traducida",
     compQuality: "Calidad",
     compOrigSize: "Original",
     compNewSize: "Nuevo",
     compDownload: "Descargar",
     logoPrompt: "Describa su logo",
     logoPlaceholder: "Logo vectorial minimalista...",
     logoBtn: "Generar Logo",
     wmLabel: "Descripción (Auto)",
     wmPlaceholder: "ej. 'texto abajo'",
     wmBtn: "Borrar Área",
     wmDesc: "Use modo Manual para pintar, o Auto para describir.",
     wmModeAuto: "Auto (Texto)",
     wmModeManual: "Manual (Pincel)",
     aiScanBtn: "Iniciar Escaneo",
     aiScanLocal: "Escaneando metadatos...",
     aiScanCloud: "Análisis visual profundo...",
     aiResultPositive: "Metadatos IA Detectados",
     aiResultNegative: "Sin Metadatos IA",
     aiToolDetected: "Herramienta",
     uploadBtn: "Subir Imagen",
     startOver: "Nueva Imagen",
     compareLabel: "Comparar: Antes vs Después",
     downloadBtn: "Descargar",
     newImage: "Nueva Imagen",
     sourceImage: "Imagen Original",
     refImage: "Imagen Referencia",
     clearRef: "Limpiar",
     toolBrush: "Pincel",
     toolRect: "Rectángulo",
     toolLasso: "Lazo",
     toolEraser: "Borrador",
     brushSize: "Tamaño",
     statusGeneratingELA: "Generando mapa ELA, MFR...",
     statusAnalyzingAI: "Ejecutando análisis forense...",
     statusProcessing: "Procesando imagen...",
     tooltipConfidence: "Nivel de confianza de la IA en el veredicto basado en características visuales.",
     tooltipAiProb: "Probabilidad de que la imagen haya sido sintetizada por IA.",
     tooltipMethod: "Método forense aplicado: "
  }
} as any;

// Fallback for missing languages
['ja', 'fr', 'de', 'pt'].forEach(l => {
  if (!TRANSLATIONS[l as Language]) TRANSLATIONS[l as Language] = TRANSLATIONS['en'];
});

const App: React.FC = () => {
  // --- STATE ---
  const [mode, setMode] = useState<AppMode>(AppMode.FORENSICS);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [lang, setLang] = useState<Language>('en');
  const [userHasSetLang, setUserHasSetLang] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Results
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [elaUrl, setElaUrl] = useState<string | null>(null);
  const [sobelUrl, setSobelUrl] = useState<string | null>(null);
  const [lnaUrl, setLnaUrl] = useState<string | null>(null);
  const [mfrUrl, setMfrUrl] = useState<string | null>(null); 
  const [modifiedImage, setModifiedImage] = useState<string | null>(null);
  const [translationResult, setTranslationResult] = useState<TranslationData | null>(null);
  const [aiScanResult, setAiScanResult] = useState<{ detected: boolean; tool?: string; prob?: number } | null>(null);
  
  // Tool States
  const [editorPrompt, setEditorPrompt] = useState("");
  const [compQuality, setCompQuality] = useState(0.8);
  const [compResultUrl, setCompResultUrl] = useState<string | null>(null);
  const [compSize, setCompSize] = useState<number>(0);
  const [targetTransLang, setTargetTransLang] = useState("English");
  const [dewatermarkMode, setDewatermarkMode] = useState<'auto' | 'manual'>('manual');
  const [watermarkText, setWatermarkText] = useState("");
  
  // Manual Brush States
  const [manualMaskBase64, setManualMaskBase64] = useState<string | null>(null);
  const [currentBrushTool, setCurrentBrushTool] = useState<BrushTool>('brush');
  const [brushSize, setBrushSize] = useState(20);
  
  // Responsive Image Ref & Observer
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDimensions, setImgDimensions] = useState<{w: number, h: number}>({ w: 500, h: 500 });

  const t = TRANSLATIONS[lang];

  // --- EFFECTS ---
  useEffect(() => {
    const detectLang = async () => {
      if (userHasSetLang) return;
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const countryCode = data.country_code; 
        const map: Record<string, Language> = {
          'CN': 'zh', 'HK': 'zh', 'TW': 'zh', 'US': 'en', 'GB': 'en', 'AU': 'en',
          'ES': 'es', 'MX': 'es', 'JP': 'ja', 'FR': 'fr', 'DE': 'de', 'BR': 'pt', 'PT': 'pt'
        };
        if (map[countryCode]) setLang(map[countryCode]);
      } catch (e) { console.warn("IP Geolocation failed"); }
    };
    detectLang();
  }, [userHasSetLang]);

  useEffect(() => {
    if (!imgRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setImgDimensions({ w: entry.contentRect.width, h: entry.contentRect.height });
        setManualMaskBase64(null); 
      }
    });
    resizeObserver.observe(imgRef.current);
    return () => resizeObserver.disconnect();
  }, [file, mode]);

  // --- HANDLERS ---

  const switchMode = (newMode: AppMode) => {
    setMode(newMode);
    setIsSidebarOpen(false);
    setAnalysisResult(null);
    setModifiedImage(null);
    setAiScanResult(null);
    setTranslationResult(null);
    setCompResultUrl(null);
    setManualMaskBase64(null);
  };

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setLoading(true);
    setLoadingText(t.statusProcessing);
    
    try {
      const base64 = await fileToBase64(uploadedFile);
      setOriginalBase64(base64);
      
      if (mode === AppMode.FORENSICS) {
        // SPEED OPTIMIZATION PIPELINE
        // 1. Prioritize Essential Maps for AI (ELA & MFR)
        setLoadingText(t.statusGeneratingELA);
        const [ela, mfr] = await Promise.all([
          generateELA(uploadedFile),
          generateMFR(uploadedFile)
        ]);

        setElaUrl(`data:image/png;base64,${ela}`);
        setMfrUrl(`data:image/png;base64,${mfr}`);
        
        // 2. Start API Call Immediately (Async)
        setLoadingText(t.statusAnalyzingAI);
        const analysisPromise = analyzeImage(base64, ela, mfr, uploadedFile.type, lang);

        // 3. Generate Secondary Maps (Sobel, LNA) in background for UI
        // While these calculate, the network request for analysisPromise is flying.
        const [sobel, lna] = await Promise.all([
          generateSobel(uploadedFile),
          generateLNA(uploadedFile)
        ]);
        setSobelUrl(`data:image/png;base64,${sobel}`);
        setLnaUrl(`data:image/png;base64,${lna}`);
        
        // 4. Await Final Result
        const result = await analysisPromise;
        setAnalysisResult(result);
      }
    } catch (error) {
      console.error(error);
      alert("Error processing image.");
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const resetApp = () => {
    setFile(null);
    setPreviewUrl(null);
    setOriginalBase64(null);
    setAnalysisResult(null);
    setModifiedImage(null);
    setElaUrl(null);
    setSobelUrl(null);
    setLnaUrl(null);
    setMfrUrl(null);
    setTranslationResult(null);
    setAiScanResult(null);
    setManualMaskBase64(null);
  };

  const runForensics = async () => {
    if (!originalBase64 || !file) return;
    setLoading(true);
    setAnalysisResult(null);
    try {
      setLoadingText(t.statusGeneratingELA);
      
      // 1. Essential Maps
      const [ela, mfr] = await Promise.all([
        generateELA(file),
        generateMFR(file)
      ]);
      
      setElaUrl(`data:image/png;base64,${ela}`);
      setMfrUrl(`data:image/png;base64,${mfr}`);
      
      // 2. Start API
      setLoadingText(t.statusAnalyzingAI);
      const analysisPromise = analyzeImage(originalBase64, ela, mfr, file.type, lang);

      // 3. Secondary Maps
      const [sobel, lna] = await Promise.all([
        generateSobel(file),
        generateLNA(file)
      ]);
      setSobelUrl(`data:image/png;base64,${sobel}`);
      setLnaUrl(`data:image/png;base64,${lna}`);

      // 4. Result
      const result = await analysisPromise;
      setAnalysisResult(result);

    } catch (e) { alert("Forensics Failed"); } 
    finally { setLoading(false); setLoadingText(""); }
  };
  
  const runEditor = async (toolType: 'BG' | 'ENHANCE' | 'CUTOUT' | 'CUSTOM') => {
    if (!originalBase64 || !file) return;
    setLoading(true);
    setLoadingText(t.statusProcessing);
    setModifiedImage(null);
    try {
      let prompt = "";
      if (toolType === 'BG') prompt = "Remove the background. Keep the subject sharp on transparent background.";
      if (toolType === 'ENHANCE') prompt = "Enhance image resolution, sharpness, and lighting.";
      if (toolType === 'CUTOUT') prompt = "Create a precise cutout of the main subject.";
      if (toolType === 'CUSTOM') prompt = editorPrompt;
      const resultBase64 = await modifyImage(originalBase64, file.type, prompt);
      setModifiedImage(`data:image/jpeg;base64,${resultBase64}`);
    } catch (e) { alert("Editing Failed"); }
    finally { setLoading(false); setLoadingText(""); }
  };

  const runTranslator = async () => {
    if (!originalBase64 || !file) return;
    setLoading(true);
    setLoadingText(t.statusProcessing);
    setModifiedImage(null);
    try {
      const data = await detectTextAndTranslate(originalBase64, file.type, targetTransLang);
      setTranslationResult(data);
      const img = new Image(); img.src = previewUrl!; await new Promise(r => img.onload = r);
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      if (data.blocks) {
        data.blocks.forEach(block => {
           const [ymin, xmin, ymax, xmax] = block.box_2d;
           const x = xmin * (img.width / 1000);
           const y = ymin * (img.height / 1000);
           const w = (xmax - xmin) * (img.width / 1000);
           const h = (ymax - ymin) * (img.height / 1000);
           const p = ctx.getImageData(Math.max(0, x), Math.max(0, y-2), 1, 1).data;
           ctx.fillStyle = `rgba(${p[0]},${p[1]},${p[2]}, 0.85)`;
           ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
           ctx.fillStyle = (p[0]*0.299 + p[1]*0.587 + p[2]*0.114) < 128 ? "white" : "black";
           ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 2;
           let fontSize = h * 0.85; ctx.font = `bold ${fontSize}px Arial, sans-serif`; ctx.textBaseline = "middle";
           const textMetrics = ctx.measureText(block.translated);
           if (textMetrics.width > w) {
              const scale = w / textMetrics.width;
              ctx.setTransform(scale, 0, 0, 1, x + (w - textMetrics.width * scale) / 2, y + h/2);
              ctx.fillText(block.translated, 0, 0);
              ctx.setTransform(1, 0, 0, 1, 0, 0);
           } else {
              ctx.fillText(block.translated, x + (w - textMetrics.width) / 2, y + h/2);
           }
        });
      }
      setModifiedImage(canvas.toDataURL('image/jpeg'));
    } catch (e) { alert("Translation Failed"); } finally { setLoading(false); setLoadingText(""); }
  };

  const runLogoGen = async () => {
    setLoading(true); setLoadingText("Generating Logo..."); setModifiedImage(null);
    try {
      let finalPrompt = file ? `Turn sketch to logo. Style: ${editorPrompt}` : `Generate logo: "${editorPrompt}". Vector, Minimalist.`;
      const resultBase64 = await modifyImage(originalBase64, file?.type || null, finalPrompt);
      setModifiedImage(`data:image/jpeg;base64,${resultBase64}`);
    } catch (e) { alert("Logo Failed"); } finally { setLoading(false); setLoadingText(""); }
  };

  const runCompressor = async () => {
    if (!file || !previewUrl) return;
    setLoading(true); setLoadingText("Compressing...");
    try {
      const img = new Image(); img.src = previewUrl; await new Promise(r => img.onload = r);
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', compQuality);
      setCompResultUrl(dataUrl);
      setCompSize(Math.round((dataUrl.length - 23) * 3 / 4));
    } catch (e) { alert("Compression Failed"); } finally { setLoading(false); setLoadingText(""); }
  };

  const runDewatermark = async () => {
    if (!originalBase64 || !file) return;
    setLoading(true); setLoadingText(t.statusProcessing); setModifiedImage(null);
    try {
      let prompt = ""; let imageToSend = originalBase64;
      if (dewatermarkMode === 'auto') {
        prompt = `Strictly remove object described as "${watermarkText || 'watermark'}". Inpaint background. No new objects.`;
      } else {
        if (!manualMaskBase64) { alert("Paint over watermark first."); setLoading(false); return; }
        const img = new Image(); img.src = previewUrl!; await new Promise(r => img.onload = r);
        const maskImg = new Image(); maskImg.src = manualMaskBase64; await new Promise(r => maskImg.onload = r);
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        ctx.drawImage(img, 0, 0); ctx.drawImage(maskImg, 0, 0, img.width, img.height);
        imageToSend = canvas.toDataURL('image/jpeg').split(',')[1];
        prompt = `Look at red mask. Remove it and content under it. Inpaint background. No new objects.`;
      }
      const resultBase64 = await modifyImage(imageToSend, file.type, prompt);
      setModifiedImage(`data:image/jpeg;base64,${resultBase64}`);
    } catch (e) { alert("Dewatermark Failed"); } finally { setLoading(false); setLoadingText(""); }
  };

  const runAiDetector = async () => {
    if (!file || !originalBase64) return;
    setLoading(true); setLoadingText("Scanning AI patterns...");
    try {
      const local = await scanForAIMetadata(file);
      if (local.detected) setAiScanResult({ detected: true, tool: local.tool, prob: 100 });
      else {
        const analysis = await analyzeImage(originalBase64, "", null, file.type, lang);
        const prob = analysis.integrity.ai_generated_probability || (analysis.integrity.is_suspected_fake ? 80 : 10);
        setAiScanResult({ detected: prob > 50, tool: "Unknown AI Model", prob });
      }
    } catch (e) { alert("Scan Failed"); } finally { setLoading(false); setLoadingText(""); }
  };

  const handleBrushDraw = (dataUrl: string) => setManualMaskBase64(dataUrl);
  
  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-50">
        <Logo />
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen?"M6 18L18 6M6 6l12 12":"M4 6h16M4 12h16M4 18h16"}/></svg></button>
      </div>
      
      {/* SIDEBAR */}
      <aside className={`fixed md:sticky md:top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-md border-r border-slate-800/50 transform transition-transform duration-300 z-50 ${isSidebarOpen?'translate-x-0':'-translate-x-full md:translate-x-0'} flex flex-col`}>
         <div className="p-6 border-b border-slate-800/50">
            <Logo />
         </div>
         <div className="p-4"><Button variant="primary" fullWidth icon={<span>+</span>} onClick={resetApp}>{t.newImage}</Button></div>
         <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
           <SidebarItem active={mode === AppMode.FORENSICS} onClick={() => switchMode(AppMode.FORENSICS)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} label={t.navForensics} description={t.navForensicsDesc} />
           <SidebarItem active={mode === AppMode.AI_DETECTOR} onClick={() => switchMode(AppMode.AI_DETECTOR)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>} label={t.navAIDetector} description={t.navAIDetectorDesc} />
           <SidebarItem active={mode === AppMode.EDITOR} onClick={() => switchMode(AppMode.EDITOR)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>} label={t.navEditor} description={t.navEditorDesc} />
           <SidebarItem active={mode === AppMode.DEWATERMARK} onClick={() => switchMode(AppMode.DEWATERMARK)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>} label={t.navDewatermark} description={t.navDewatermarkDesc} />
           <SidebarItem active={mode === AppMode.TRANSLATOR} onClick={() => switchMode(AppMode.TRANSLATOR)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>} label={t.navTranslator} description={t.navTranslatorDesc} />
           <SidebarItem active={mode === AppMode.LOGO} onClick={() => switchMode(AppMode.LOGO)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>} label={t.navLogo} description={t.navLogoDesc} />
           <SidebarItem active={mode === AppMode.COMPRESSOR} onClick={() => switchMode(AppMode.COMPRESSOR)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>} label={t.navCompress} description={t.navCompressDesc} />
         </div>
         <div className="p-4 bg-slate-900"><select className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded p-2" value={lang} onChange={(e) => {setLang(e.target.value as Language); setUserHasSetLang(true);}}><option value="en">English</option><option value="zh">中文</option><option value="es">Español</option><option value="ja">日本語</option><option value="fr">Français</option><option value="de">Deutsch</option><option value="pt">Português</option></select></div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-950">
        {/* HEADER & UPLOAD UI */}
        <section className="mb-8">
           <h1 className="text-3xl md:text-4xl font-bold text-white">{t[`nav${mode === 'AI_DETECTOR' ? 'AIDetector' : mode.charAt(0) + mode.slice(1).toLowerCase()}`]}</h1>
           <p className="text-slate-400">{t[`nav${mode === 'AI_DETECTOR' ? 'AIDetector' : mode.charAt(0) + mode.slice(1).toLowerCase()}Desc`]}</p>
        </section>
        
        {!file && mode !== AppMode.LOGO && (
          <div className="max-w-2xl mx-auto mt-20"><UploadArea onFileSelect={handleFileUpload} label={t.uploadBtn} subLabel="Supported: JPG, PNG, WebP" /></div>
        )}
        
        {(!file && mode === AppMode.LOGO) && (
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
            <div className="col-span-1"><Card title={t.refImage}><UploadArea onFileSelect={handleFileUpload} label="Upload Sketch" compact /></Card></div>
            <div className="col-span-2"><Card title="Config"><textarea className="w-full bg-slate-800 border border-slate-700 rounded p-4 text-white mb-4" rows={4} placeholder={t.logoPlaceholder} value={editorPrompt} onChange={e=>setEditorPrompt(e.target.value)}/><Button fullWidth onClick={runLogoGen} loading={loading} disabled={!editorPrompt}>{t.logoBtn}</Button></Card></div>
          </div>
        )}

        {(file || (mode === AppMode.LOGO && modifiedImage)) && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* LEFT COLUMN (Source & Tools) */}
            <section className="space-y-6">
              <Card title={mode===AppMode.LOGO?t.refImage:t.sourceImage} action={file?<button onClick={resetApp} className="text-slate-400 hover:text-red-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>:null}>
                {file ? (
                   <div className="flex justify-center items-center bg-slate-950 border border-slate-800 rounded p-2">
                     <div className="relative inline-block">
                       <img ref={imgRef} src={previewUrl!} alt="Source" className="max-h-[500px] w-auto object-contain block" />
                       {mode === AppMode.DEWATERMARK && dewatermarkMode === 'manual' && (
                         <>
                           <div className="absolute inset-0 z-10"><BrushCanvas width={imgDimensions.w} height={imgDimensions.h} onDrawEnd={handleBrushDraw} tool={currentBrushTool} brushSize={brushSize} className="w-full h-full opacity-50"/></div>
                           <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full px-4 py-2 flex gap-4 shadow-xl z-20" onClick={e=>e.stopPropagation()}>
                              <button onClick={()=>setCurrentBrushTool('brush')} className={currentBrushTool==='brush'?'text-yellow-400':'text-slate-400'}><Tooltip content={t.toolBrush}>🖊️</Tooltip></button>
                              <button onClick={()=>setCurrentBrushTool('rect')} className={currentBrushTool==='rect'?'text-yellow-400':'text-slate-400'}><Tooltip content={t.toolRect}>⬜</Tooltip></button>
                              <button onClick={()=>setCurrentBrushTool('lasso')} className={currentBrushTool==='lasso'?'text-yellow-400':'text-slate-400'}><Tooltip content={t.toolLasso}>➰</Tooltip></button>
                              <button onClick={()=>setCurrentBrushTool('eraser')} className={currentBrushTool==='eraser'?'text-yellow-400':'text-slate-400'}><Tooltip content={t.toolEraser}>🧼</Tooltip></button>
                              <div className="w-px h-6 bg-slate-700"></div>
                              <div className="w-24"><Slider value={brushSize} min={5} max={100} step={5} onChange={setBrushSize} className="h-2"/></div>
                           </div>
                         </>
                       )}
                     </div>
                   </div>
                ) : (
                   <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-700 rounded bg-slate-800/30"><UploadArea onFileSelect={handleFileUpload} label="Upload" compact /></div>
                )}
              </Card>

              {/* TOOL CONTROLS */}
              {mode === AppMode.EDITOR && (<Card title={t.editorTools}><div className="grid grid-cols-2 gap-4 mb-4"><Button variant="secondary" onClick={()=>runEditor('BG')} loading={loading}>{t.toolRemoveBg}</Button><Button variant="secondary" onClick={()=>runEditor('ENHANCE')} loading={loading}>{t.toolEnhance}</Button><Button variant="secondary" onClick={()=>runEditor('CUTOUT')} loading={loading}>{t.toolCutout}</Button></div><textarea className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm" rows={2} placeholder={t.toolPromptPlaceholder} value={editorPrompt} onChange={e=>setEditorPrompt(e.target.value)}/><Button fullWidth onClick={()=>runEditor('CUSTOM')} loading={loading} disabled={!editorPrompt}>Apply</Button></Card>)}
              {mode === AppMode.TRANSLATOR && (<Card title="Settings"><select className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm mb-4 w-full" value={targetTransLang} onChange={e=>setTargetTransLang(e.target.value)}><option>English</option><option>Chinese</option><option>Spanish</option><option>Japanese</option><option>French</option></select><Button fullWidth onClick={runTranslator} loading={loading}>{t.transBtn}</Button></Card>)}
              {mode === AppMode.COMPRESSOR && (<Card title="Settings"><Slider label={t.compQuality} value={compQuality*100} min={10} max={100} step={5} onChange={v=>setCompQuality(v/100)} suffix="%"/><Button fullWidth onClick={runCompressor} loading={loading} className="mt-4">Compress</Button></Card>)}
              {mode === AppMode.DEWATERMARK && (<Card title={t.navDewatermark}><div className="flex bg-slate-800 p-1 rounded mb-4"><button onClick={()=>setDewatermarkMode('manual')} className={`flex-1 py-1.5 text-sm rounded ${dewatermarkMode==='manual'?'bg-primary-600 text-white':'text-slate-400'}`}>{t.wmModeManual}</button><button onClick={()=>setDewatermarkMode('auto')} className={`flex-1 py-1.5 text-sm rounded ${dewatermarkMode==='auto'?'bg-primary-600 text-white':'text-slate-400'}`}>{t.wmModeAuto}</button></div>{dewatermarkMode==='auto' && <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-sm mb-4" placeholder={t.wmPlaceholder} value={watermarkText} onChange={e=>setWatermarkText(e.target.value)}/><Button fullWidth onClick={runDewatermark} loading={loading} variant="danger">{t.wmBtn}</Button>}<Button fullWidth onClick={runDewatermark} loading={loading} variant="danger">{t.wmBtn}</Button></Card>)}
              {mode === AppMode.AI_DETECTOR && (<Card title="Scan"><Button fullWidth variant="primary" onClick={runAiDetector} loading={loading}>{t.aiScanBtn}</Button></Card>)}
            </section>

            {/* RIGHT COLUMN (Results) */}
            <section className="space-y-6">
               {loading && !analysisResult && !modifiedImage && (
                 <Card className="animate-pulse text-center py-12"><Spinner className="w-12 h-12 mx-auto mb-4"/><h3 className="text-xl font-semibold">{loadingText}</h3></Card>
               )}

               {/* FORENSICS REPORT */}
               {mode === AppMode.FORENSICS && (
                 <div className="space-y-6">
                    {/* 1. REPORT FIRST (Top Right) */}
                    {analysisResult && (
                      <Card title={t.forensicsTitle} className="animate-fade-in">
                          <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className={`text-4xl ${analysisResult.integrity.is_suspected_fake?"text-red-500":"text-green-500"}`}>{analysisResult.integrity.is_suspected_fake?"⚠️":"🛡️"}</div>
                                <div>
                                  <h3 className={`text-xl font-bold ${analysisResult.integrity.is_suspected_fake?"text-red-400":"text-green-400"}`}>{analysisResult.integrity.is_suspected_fake?t.fakeSuspected:t.fakeAuthentic}</h3>
                                  <p className="text-sm text-slate-500">Confidence: {analysisResult.integrity.confidence_score}%</p>
                                </div>
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">{analysisResult.integrity.reasoning}</p>
                          
                          {/* AI Analysis Details */}
                          {analysisResult.integrity.ai_analysis && (
                            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                              <div className={`p-2 rounded ${analysisResult.integrity.ai_analysis.unnatural_textures ? 'bg-red-900/30 text-red-300 border border-red-900' : 'bg-slate-800 text-slate-500'}`}>Texture Issues</div>
                              <div className={`p-2 rounded ${analysisResult.integrity.ai_analysis.inconsistent_lighting ? 'bg-red-900/30 text-red-300 border border-red-900' : 'bg-slate-800 text-slate-500'}`}>Bad Lighting</div>
                              <div className={`p-2 rounded ${analysisResult.integrity.ai_analysis.semantic_inconsistencies ? 'bg-red-900/30 text-red-300 border border-red-900' : 'bg-slate-800 text-slate-500'}`}>Logic Flaws</div>
                            </div>
                          )}
                      </Card>
                    )}

                    {/* 2. MAPS SECOND (Below Report) */}
                    {(elaUrl || sobelUrl) && (
                      <Card title="Forensic Maps (Evidence)" className="animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                            {elaUrl && (<div><h4 className="text-xs font-medium text-slate-300 mb-2">ELA HEATMAP (Compression)</h4><img src={elaUrl} className="rounded border border-slate-700 w-full aspect-square object-contain bg-black" alt="ELA"/></div>)}
                            {mfrUrl && (<div><h4 className="text-xs font-medium text-slate-300 mb-2">MFR VOIDS (Noise Density)</h4><img src={mfrUrl} className="rounded border border-slate-700 w-full aspect-square object-contain bg-black" alt="MFR"/></div>)}
                            {sobelUrl && (<div><h4 className="text-xs font-medium text-slate-300 mb-2">SOBEL EDGES (Ghosting)</h4><img src={sobelUrl} className="rounded border border-slate-700 w-full aspect-square object-contain bg-black" alt="SOBEL"/></div>)}
                            {lnaUrl && (<div><h4 className="text-xs font-medium text-slate-300 mb-2">LNA ANALYSIS (Variance)</h4><img src={lnaUrl} className="rounded border border-slate-700 w-full aspect-square object-contain bg-black" alt="LNA"/></div>)}
                        </div>
                      </Card>
                    )}
                 </div>
               )}

               {/* OTHER RESULTS */}
               {modifiedImage && (<Card title="Result"><CompareSlider before={previewUrl!} after={modifiedImage} className="h-[400px] rounded border border-slate-700"/><div className="mt-4"><a href={modifiedImage} download="result.jpg"><Button fullWidth>Download</Button></a></div></Card>)}
               {mode === AppMode.AI_DETECTOR && aiScanResult && (<Card title="Deep Scan"><div className="text-center py-8"><div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${aiScanResult.detected?'bg-red-500/20 text-red-500':'bg-green-500/20 text-green-500'}`}><span className="text-3xl font-bold">{aiScanResult.detected ? "AI" : "REAL"}</span></div><div className="text-sm text-slate-400 mb-2">Probability: {aiScanResult.prob}%</div><h3 className="text-2xl font-bold mb-2">{aiScanResult.detected?t.aiResultPositive:t.aiResultNegative}</h3>{aiScanResult.tool && <div className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm mt-2">{aiScanResult.tool}</div>}</div></Card>)}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;