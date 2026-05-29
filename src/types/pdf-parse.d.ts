declare module 'pdf-parse/lib/pdf-parse.js' {
  function pdfParse(
    dataBuffer: Buffer,
    options?: Record<string, unknown>
  ): Promise<{
    text: string
    numpages: number
    info: unknown
    metadata: unknown
  }>
  export default pdfParse
}
