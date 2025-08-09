
import { Navigate } from 'react-router-dom';

export default function Index() {
  // Redirect to root which will handle proper routing logic
  return <Navigate to="/" replace />;
}
