import { ThemeProvider } from '@mui/material'
import EmailClassifier from './components/EmailClassifier'
import theme from './theme/theme'

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <EmailClassifier />
    </ThemeProvider>
  )
}

export default App
