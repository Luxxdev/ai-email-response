import React, { useState } from 'react'
import { useEmailClassifier } from '../hooks/useEmailClassifier'
import type { EmailRequest } from '../types/email'
import { Button, CircularProgress, FormLabel, Grid, TextField, Typography } from '@mui/material'
import FileUploadIcon from '@mui/icons-material/FileUpload'

const EmailClassifier: React.FC = () => {
  const [emailContent, setEmailContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState('')
  const [sender, setSender] = useState('')

  const { classifyEmail, isLoading, result, error, reset } = useEmailClassifier()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailContent.trim()) {
      alert('Por favor, insira o conteúdo do email')
      return
    }

    const emailData: EmailRequest = {
      content: emailContent,
      subject: subject || undefined,
      sender: sender || undefined,
    }

    await classifyEmail(emailData)
    document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleReset = () => {
    setEmailContent('')
    setSubject('')
    setSender('')
    setFile(null)
    reset()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setEmailContent(text)
      }
      reader.readAsText(uploadedFile)
    }
  }

  return (
    <>
      <Typography display={'flex'} justifyContent={'center'} alignItems={'center'} variant="h2" mt={10} borderBottom={1} pb={5}>
        Classificador de Emails
      </Typography>
      <Grid container display={'flex'} flexDirection={'column'} alignItems={'center'} justifyContent={'center'} height={'100%'} spacing={5} mt={5}>
        <Typography variant="h5">Clique para fazer upload ou arraste um arquivo</Typography>

        <Grid display={'flex'} alignItems={'center'} justifyContent={'center'} flexDirection={'column'}>
          <Typography variant="h6" mb={2}>
            Upload de Arquivo (.txt, .pdf)
          </Typography>
          <Button>
            <FormLabel>
              <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} id="file-upload" disabled={isLoading} hidden />
              <FileUploadIcon cursor={'pointer'} />
            </FormLabel>
          </Button>
          {file && (
            <Typography mt={2}>
              Arquivo carregado: <strong>{file.name}</strong>
            </Typography>
          )}
        </Grid>
        <form onSubmit={handleSubmit} style={{ width: '50vw' }}>
          <Grid display={'flex'} alignItems={'center'} justifyContent={'center'} flexDirection={'column'} mb={5}>
            <Typography variant="h5" mb={2}>
              Conteúdo do Email
            </Typography>
            <TextField
              fullWidth
              multiline={true}
              minRows={5}
              maxRows={12}
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Cole aqui o conteúdo do email para análise..."
              required
            />
          </Grid>

          {isLoading ? (
            <Grid display={'flex'} alignItems={'center'} justifyContent={'center'} flexDirection={'column'} rowGap={2}>
              <Typography>Analisando...</Typography>
              <CircularProgress />
            </Grid>
          ) : (
            <Grid display={'flex'} alignItems={'center'} justifyContent={'center'}>
              <Button type="submit" disabled={isLoading || !emailContent.trim()} style={{ margin: '0 1vw' }}>
                <Typography>Analisar Email</Typography>
              </Button>
              <Button onClick={handleReset} style={{ margin: '0 1vw' }}>
                <Typography>Limpar Texto</Typography>
              </Button>
            </Grid>
          )}
        </form>

        <div id="result-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {error && (
            <Grid size={6} display={'flex'} alignItems={'center'} justifyContent={'center'} flexDirection={'column'}>
              <Typography>Resposta Sugerida:</Typography>
              <Typography>"{error}"</Typography>
            </Grid>
          )}

          {result && (
            <>
              <Grid size={6} display={'flex'} alignItems={'center'} justifyContent={'center'} flexDirection={'column'}>
                <Typography mb={2} fontWeight={'bold'}>
                  Categoria: {result.category.toUpperCase()}
                </Typography>
                <Typography mb={2}>Resposta Sugerida:</Typography>
                <Typography mb={2} textAlign={'justify'}>
                  "{result.suggested_response}"
                </Typography>
              </Grid>

              <Grid size={6} display={'flex'} alignItems={'center'} justifyContent={'center'} flexDirection={'column'} textAlign={'center'}>
                <Typography mb={2} fontWeight={'bold'}>
                  {' '}
                  Análise Detalhada:
                </Typography>
                <Typography mb={2}>Tamanho do conteúdo: {result.analysis.content_length} caracteres</Typography>
                <Typography>Palavras-chave:{result.analysis.keywords.length}</Typography>
                {result.analysis.keywords.length > 0 && (
                  <Typography mb={2}>
                    {result.analysis.keywords.map((keyword, index) => (
                      <React.Fragment key={index}>[{keyword}], </React.Fragment>
                    ))}
                  </Typography>
                )}
                <Typography mb={2}>Raciocínio:{result.analysis.reasoning}</Typography>
                <Typography mb={2}>Processado em: {result.processing_time.toFixed(3)} segundos</Typography>
              </Grid>
            </>
          )}
        </div>
      </Grid>
    </>
  )
}

export default EmailClassifier
