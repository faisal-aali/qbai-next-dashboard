// pages/leaderboard/page.tsx
import Layout from '../../components/Layout/Layout';
import { Typography } from '@mui/material';
import { redirect } from 'next/navigation';

const IosAppPage = () => {

  redirect('https://apps.apple.com/us/app/qbai/id6734226679'); // Replace '/target-page' with your desired URL

  return (
    <Layout>
      <Typography>Redirecting to the app</Typography>
    </Layout>
  );
};

export default IosAppPage;
