import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from "@mui/material";
import { User } from "../types";

interface BloodPressureProps {
  user: User;
}

// Fake blood pressure data
const fakeData = [
  { id: 1, patient: "John Doe", systolic: 120, diastolic: 80, date: "2025-12-04 08:30", status: "Normal" },
  { id: 2, patient: "Jane Smith", systolic: 145, diastolic: 95, date: "2025-12-04 09:15", status: "High" },
  { id: 3, patient: "Bob Johnson", systolic: 110, diastolic: 70, date: "2025-12-04 10:00", status: "Normal" },
  { id: 4, patient: "Alice Brown", systolic: 160, diastolic: 100, date: "2025-12-04 10:45", status: "High" },
  { id: 5, patient: "Charlie Wilson", systolic: 118, diastolic: 78, date: "2025-12-04 11:30", status: "Normal" },
  { id: 6, patient: "Diana Martinez", systolic: 135, diastolic: 88, date: "2025-12-04 12:15", status: "Elevated" },
  { id: 7, patient: "Edward Davis", systolic: 122, diastolic: 82, date: "2025-12-04 13:00", status: "Normal" },
  { id: 8, patient: "Fiona Garcia", systolic: 150, diastolic: 96, date: "2025-12-04 13:45", status: "High" },
];

function BloodPressure({ user }: BloodPressureProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal":
        return "success";
      case "Elevated":
        return "warning";
      case "High":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h3" component="h1" fontWeight={700} sx={{ mb: 3 }}>
          Blood Pressure Checks
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Systolic</TableCell>
                <TableCell>Diastolic</TableCell>
                <TableCell>Reading</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fakeData.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{record.patient}</TableCell>
                  <TableCell>{record.systolic}</TableCell>
                  <TableCell>{record.diastolic}</TableCell>
                  <TableCell>
                    <strong>{record.systolic}/{record.diastolic}</strong> mmHg
                  </TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <Chip
                      label={record.status}
                      color={getStatusColor(record.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}

export default BloodPressure;
