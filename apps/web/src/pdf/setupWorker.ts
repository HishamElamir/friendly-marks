import * as pdfjsLib from 'pdfjs-dist'
// The `?url` suffix is a Vite convention: it resolves to the built asset's URL
// instead of inlining the module, which is what pdfjs' worker needs.
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjsLib }
