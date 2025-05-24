import { createTheme, responsiveFontSizes } from '@mui/material'

let theme = createTheme({
  palette: {
    primary: {
      main: '#555555',
    },
  },
  typography: {
    allVariants: {
      color: '#555555',
    },
    fontFamily: 'Verdana',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#dddddd',
          color: '#555555',
          '&:hover': {
            backgroundColor: '#bbbbbb',
          },
        },
      },
    },
  },
})

theme = responsiveFontSizes(theme)

export default theme
