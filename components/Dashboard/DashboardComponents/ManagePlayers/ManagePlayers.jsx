"use client";
import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Add from "@mui/icons-material/Add";
import { green } from "@mui/material/colors";
import AddNewPlayerModal from "../AddNewPlayerModal/AddNewPlayerModal";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { convertCmToFeetAndInches } from "@/util/utils";
import { useSession } from "next-auth/react";
import UploadModal from "../UploadVideoModal/UploadModal";
import { Edit, EditOutlined } from "@mui/icons-material";
import EditPlayerModal from "../EditPlayerModal/EditPlayerModal";

const PlayerCard = ({ player, playersMetrics, setShowUploadModal, setSelectedPlayerId, setShowEditPlayerModal }) => {
  const router = useRouter()

  const handleEditPlayer = () => {
    setSelectedPlayerId(player._id)
    setShowEditPlayerModal(true)
  }

  return (
    <Card className="bg-transparent p-1 border primary-border">
      <Grid container flexDirection={{ xs: 'column', sm: 'row' }} padding={1} gap={2}>
        <Grid item display={'flex'} justifyContent={'center'}>
          <CardMedia component={'img'} style={{ width: 140, height: 165, borderRadius: '8px', objectFit: 'cover', objectPosition: '50% 10%' }} image={player.avatarUrl || '/assets/player.png'} />
        </Grid>
        <Grid item alignItems={'center'} justifyContent={{ xs: 'center' }} display={'flex'} xs>
          <CardContent style={{ padding: 0 }}>
            <Grid container flexDirection={'column'} display={'flex'} alignItems={{ xs: 'center', sm: 'start' }} gap={2}>
              <Grid item container justifyContent={'space-between'}>
                <Grid item>
                  <Typography className="!text-white !text-2xl">{player.name}</Typography>
                </Grid>
                <Grid item display={playersMetrics ? 'none' : 'block'}>
                  <IconButton sx={{ color: 'primary.contrastText' }} onClick={handleEditPlayer}>
                    <EditOutlined />
                  </IconButton>
                </Grid>
              </Grid>
              <Grid item container gap={2}>
                <Grid item className="blueBackground w-32 md:w-36	text-center py-2 px-4 md:px-8 primary-border-green rounded">
                  <Typography className="text-white text-lg	">{convertCmToFeetAndInches(player.roleData.height).string}</Typography>
                </Grid>
                <Grid item className="blueBackground w-32 md:w-36	text-center py-2 px-4 md:px-8 primary-border-green rounded">
                  <Typography className="text-white text-lg	">{player.roleData.weight} lbs</Typography>
                </Grid>
              </Grid>
              <Grid item container gap={2} justifyContent={'space-between'}>
                <Grid item display={playersMetrics ? 'none' : 'block'}>
                  <button onClick={() => {
                    setSelectedPlayerId(player._id)
                    setShowUploadModal(true)
                  }} className="bg-white dark-blue-color font-bold rounded w-28 md:w-32 h-9  flex items-center justify-center text-base">
                    UPLOAD
                  </button>
                </Grid>
                <Grid item xs>
                  <button onClick={() => router.push(`/metrics?playerId=${player._id}`)} style={{ width: playersMetrics && '100%' }} className="bg-primary text-black rounded w-36 md:w-40 h-9 flex items-center justify-center text-base hover-button-shadow">
                    VIEW METRICS
                  </button>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  )
}

const ManagePlayers = () => {
  const userSession = useSession().data?.user || {}
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname()
  const [players, setPlayers] = useState()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false)
  const playersMetrics = (pathname == '/players-metrics')

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = () => {
    axios.get('/api/users', { params: { role: 'player', trainerId: userSession._id } }).then(res => {
      setPlayers(res.data)
    }).catch(console.error)
  }

  // const handleCategoryChange = (event, newValue) => {
  //   setSelectedCategory(newValue);
  // };

  // const handleSearchChange = (event) => {
  //   setSearchQuery(event.target.value);
  // };

  const filteredPlayers = players?.filter((player) => player.name.toLowerCase().match(searchQuery.toLowerCase()));

  return (
    <div className="grid gap-4 py-8 ">
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
        <div className="flex items-center flex-col md:flex-row gap-4 md:gap-8 w-full md:w-[83%]">
          <div className="w-full md:w-fit">
            <h3>{playersMetrics ? 'Players Metrics' : 'Added Players'}</h3>
          </div>
          <div className="search-bar w-full md:w-2/5">
            <input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-2 py-1 rounded-lg text-white h-12 search-background focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
        <div className={`flex justify-center`}>
          <button
            className="bg-primary dark-blue-color rounded w-44 h-14 flex items-center justify-center text-lg rounded-lg" onClick={() => setShowModal(true)}
          >
            ADD PLAYER
          </button>
        </div>
      </div>
      <div>
        {!players ? <CircularProgress /> :
          <Grid container spacing={2}>
            {filteredPlayers.map(player => (
              <Grid item key={player.id} xs={12} sm={12} md={12} lg={6} xl={4} >
                <PlayerCard setSelectedPlayerId={setSelectedPlayerId} setShowUploadModal={setShowUploadModal} setShowEditPlayerModal={setShowEditPlayerModal} player={player} playersMetrics={playersMetrics} />
              </Grid>
            ))}
            <Grid item paddingTop={2} paddingLeft={2} xs display={'flex'} alignItems={'center'} justifyContent={'center'} >
              <Grid item height={'100%'} width={'100%'} onClick={() => setShowModal(true)} className="border primary-border rounded" alignItems={'center'} justifyContent={'center'} display={playersMetrics ? 'none' : 'flex'} sx={{ ':hover': { bgcolor: green[900], cursor: 'pointer' } }} >
                <IconButton>
                  <Add className="text-primary" fontSize="large" />
                </IconButton>
              </Grid>
            </Grid>
          </Grid>}
      </div>
      {showModal && <AddNewPlayerModal onClose={() => setShowModal(false)} open={showModal} onSuccess={fetchPlayers} />}
      {showUploadModal && <UploadModal playerId={selectedPlayerId} open={showUploadModal} onClose={() => setShowUploadModal(false)} onSuccess={() => setShowUploadModal(false)} type={'upload'} />}
      {showEditPlayerModal && <EditPlayerModal open={showEditPlayerModal} onClose={() => setShowEditPlayerModal(false)} playerData={players.find(player => player._id === selectedPlayerId)} onSuccess={fetchPlayers} />}
    </div>
  );
};

export default ManagePlayers;
