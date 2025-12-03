import { Alert, Box, Button, Container, Typography } from "@mui/material";
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error("Error caught by boundary:", error, errorInfo);

    // You could also log this to an error reporting service
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Alert severity="error" sx={{ width: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                An unexpected error occurred. Please try refreshing the page or
                contact support if the problem persists.
              </Typography>
              {import.meta.env.DEV && this.state.error && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      whiteSpace: "pre-wrap",
                      fontSize: "0.75rem",
                      backgroundColor: "rgba(0,0,0,0.1)",
                      p: 1,
                      borderRadius: 1,
                      overflow: "auto",
                      maxHeight: "200px",
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Box>
              )}
            </Alert>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="contained" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Box>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
