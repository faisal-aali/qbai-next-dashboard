"use client";
import React,{ useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import YouTubeIcon from "@mui/icons-material/YouTube";
import AddVideoModal from "../AddVideoModal/AddVideoModal";
import EditVideoModal from "../EditVideoModal/EditVideoModal";
import DeleteDrillModal from "../DeleteDrillModal/DeleteDrillModal";
import PayToWatchDialog from "../../../Common/PayToWatchDialog/PayToWatchDialog";
import { useApp } from "@/components/Context/AppContext";
import { convertVimeoUrlToEmbed, getRandomizedArray } from "@/util/utils";
import Pagination from "../../../Common/Pagination/Pagination";
import { Typography, Divider, IconButton, Tooltip, TextField, MenuItem } from "@mui/material";
import { Info } from "@mui/icons-material";
import Joyride from 'react-joyride';

const VideoCard = ({ video, videos, setSelectedVideoId, setSelectedVideoData, setShowEditModal, setShowDeleteModal, setIsModalOpen, handleOpenPayModal, whyRecommended }) => {
  const { user } = useApp();

  const handleEditClick = (videoId) => {
    const video = videos.find((v) => v._id === videoId);
    setSelectedVideoId(videoId);
    setSelectedVideoData(video);
    setShowEditModal(true);
  };

  const handleDeleteClick = (videoId) => {
    setSelectedVideoId(videoId);
    setShowDeleteModal(true);
  };

  return (
    <Card
    sx={{
      borderRadius: "10px",
      backgroundColor: "transparent",
      boxShadow: "none",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    }}
    className="relative"
  >
    <div
      className="relative w-full"
      style={{ paddingTop: "56.25%" }}
    >
      <CardMedia
        component={video.videoLink ? "iframe" : "img"}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        src={
          video.videoLink
            ? video.videoLink.match("vimeo")
              ? convertVimeoUrlToEmbed(video.videoLink)
              : video.videoLink
            : video.thumbnailUrl
        }
        title={video.title}
        className="rounded-lg"
        allowFullScreen
        style={{
          filter: !video.videoLink ? "blur(5px)" : "none",
        }}
      />
      {!video.videoLink && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-lg"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
          onClick={handleOpenPayModal}
        >
          <img
            src="/assets/lock-icon.png"
            alt="Locked"
            className="w-8 h-8 md:w-10 md:h-10"
          />
        </div>
      )}
    </div>

    <CardContent className="!p-3 !pb-2 mt-2 flex-grow">
      <Grid
        container
        gap={1}
        justifyContent={"space-between"}
        height="100%"
      >
        <Grid
          item
          container
          flexDirection={"column"}
          xs={true}
          spacing={1}
        >
          <Grid
            item
            container
            justifyContent={"space-between"}
            alignItems="flex-start"
            wrap="nowrap"
          >
            <Grid
              item
              sx={{ flex: 1, pr: video.metCriteria ? 1 : 0 }}
            >
              <p className="text-sm md:text-base font-semibold text-white line-clamp-2">
                {video.title}
              </p>
            </Grid>
            {video.metCriteria && (
              <Grid item>
                <Tooltip
                  title={
                    <div style={{ whiteSpace: "pre-line" }}>
                      {video.metCriteria
                        .map(
                          (c) =>
                            `${
                              user?.role === "player"
                                ? "Your"
                                : "Player's"
                            } ${c.description}`
                        )
                        .join("\n")}
                    </div>
                  }
                  placement="bottom"
                >
                  <Info
                    sx={{
                      color: "gray",
                      fontSize: {
                        xs: "1.1rem",
                        sm: "1.2rem",
                      },
                      mt: "2px",
                    }}
                  />
                </Tooltip>
              </Grid>
            )}
          </Grid>
          <Grid item>
            <p className="text-xs md:text-sm text-gray-300 line-clamp-2">
              {video.description}
            </p>
          </Grid>
        </Grid>
        {user?.role === "admin" && (
          <Grid
            item
            container
            gap={1}
            xs={"auto"}
            alignItems="flex-start"
          >
            <Grid item>
              <button
                onClick={() => handleEditClick(video._id)}
                className="bg-white flex justify-center items-center w-7 h-7 text-green-600 rounded p-1.5 focus:outline-none hover:bg-gray-100 transition-colors"
              >
                <img
                  src="/assets/edit-icon.svg"
                  alt="Edit"
                  className="w-4 h-4"
                />
              </button>
            </Grid>
            <Grid item>
              <button
                onClick={() => handleDeleteClick(video._id)}
                className="button-danger flex justify-center items-center w-7 h-7 rounded p-1.5 focus:outline-none hover:opacity-90 transition-opacity"
              >
                <img
                  src="/assets/delete-icon-white.svg"
                  alt="Delete"
                  className="w-4 h-4"
                />
              </button>
            </Grid>
          </Grid>
        )}
      </Grid>
    </CardContent>
  </Card>
  );
};

const DrillLibrary = () => {
  const { user } = useApp();
  const fetchDrillsTimeout = useRef(null);
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const prevSearchQueryRef = useRef(searchQuery);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [selectedVideoData, setSelectedVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recommendationsCriteria, setRecommendationsCriteria] = useState([]);
  const [recommendationsSections, setRecommendationsSections] = useState([]);
  const [trainerPlayers, setTrainerPlayers] = useState();
  const [selectedPlayerId, setSelectedPlayerId] = useState();

  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [fetchingRecommendedVideos, setFetchingRecommendedVideos] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const videosPerPage = 12;

  const [runTour, setRunTour] = useState(false);

  const [tour, setTour] = useState([
    {
      target: '.recommended-videos-section',
      content: 'This is the recommended videos section',
      placement: 'right',
      disableBeacon: true,
      disableOverlay: true,
      disableScrolling: true,
    },
    {
      target: '.recommended-videos-tab',
      content: 'Here you can see all the recommended videos',
      placement: 'bottom',
      disableBeacon: true,
      disableOverlay: true,
      disableScrolling: true,
    },
  ]);

  const recommendedVideosRandomized = useMemo(() => getRandomizedArray(recommendedVideos, 6), [recommendedVideos]);

  const showRecommendedSection = useMemo(() => !searchQuery && selectedCategory === 'all' && currentPage === 1 && recommendedVideos.length > 0 && user?.role === 'player', [searchQuery, selectedCategory, currentPage, recommendedVideos, user])

  const populatedRecommendedSections = useMemo(() => {
    if (!recommendedVideos.length || !recommendationsSections.length) return [];

    const categorizedVideos = []

    const populatedRecommendedSections = recommendationsSections.map(section => {
        return {
          ...section,
        videos: recommendedVideos.filter(video => {
          const result = video.metCriteria
            && video.metCriteria.some(({ refId }) => section.criteriaIds.includes(refId))
            if (result) {
            categorizedVideos.push(video._id)
            }
          return result
        })
      }
    })

    populatedRecommendedSections.push({
      _id: 'uncategorized',
      name: 'Uncategorized',
      videos: recommendedVideos.filter(video => !categorizedVideos.includes(video._id))
    })

    return populatedRecommendedSections
  }, [recommendationsSections, recommendedVideos])

  console.log('populatedRecommendedSections', populatedRecommendedSections)

  const fetchDrills = async () => {
    try {
      setLoading(true);

      const query = {
        page: currentPage,
        limit: videosPerPage,
        search: searchQuery || undefined
      }

      if (!['all', 'recommended'].includes(selectedCategory)) {
        query.categoryId = selectedCategory;
      }

      const { data } = await axios.get("/api/v2/drills", {
        params: query
      });
      setVideos(data.drills);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error("Error fetching drills:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedDrills = async (userRole, playerId) => {
    try {
      setFetchingRecommendedVideos(true);
      const params = {};
      if (userRole === 'trainer') {
        params.playerId = playerId;
      }
      const { data } = await axios.get("/api/drills/recommended", { params });
      setRecommendedVideos(data);
      if (localStorage.getItem('ranTour') !== 'true') {
        setRunTour(true);
        localStorage.setItem('ranTour', 'true');
      }
    } catch (error) {
      console.error("Error fetching recommended drills", error);
    } finally {
      setFetchingRecommendedVideos(false);
    }
  }

  const fetchCategoriesAndRecommendationsCriterias = async () => {
    try {
      if (!user || !user.role) return;

      const [categoryResponse, recommendationsCriteriaResponse, recommendationsSectionsResponse] = await Promise.all([
        axios.get("/api/categories"),
        user.role === 'admin' && axios.get("/api/drills/recommendationsCriteria"),
        axios.get("/api/drills/recommendationsSections")
      ]);

      const categoryList = categoryResponse.data.map((cat) => ({
        name: cat.name,
        _id: cat._id,
      }));

      setCategories(categoryList);

      setRecommendationsSections(recommendationsSectionsResponse.data);

      if (recommendationsCriteriaResponse) {
        setRecommendationsCriteria(
          recommendationsCriteriaResponse.data.map((criteria) => {
              if (criteria.doubleValue) {
                return [
                  {
                    ...criteria,
                  _id: criteria._id + '_1'
                  },
                  {
                    ...criteria,
                  _id: criteria._id + '_2'
                }
              ]
              } else {
              return criteria
              }
          }).flat()
        );
      }

    } catch (error) {
      console.error("Error fetching categories and videos", error);
    }
  };

  const fetchTrainerPlayers = async () => {
    if (!user) return;
    const { data } = await axios.get("/api/autocomplete/users", { params: { role: 'player', trainerId: user._id } });
    setTrainerPlayers(data);
  }

  useEffect(() => {
    console.log('user changed', user)
    if (!user) return;
    fetchCategoriesAndRecommendationsCriterias();
    if (user.role === 'trainer') {
      fetchTrainerPlayers();
    }
  }, [user]);

  useEffect(() => {
    if (!trainerPlayers) return;
    const firstPlayer = trainerPlayers[0];
    if (firstPlayer) {
      setSelectedPlayerId(firstPlayer._id);
    }
  }, [trainerPlayers]);

  useEffect(() => {
    if (!user) return;

    if (user.role === 'player') {
      fetchRecommendedDrills(user.role);
    }

    if (user.role === 'trainer') {
      if (!selectedPlayerId) return;
      fetchRecommendedDrills(user.role, selectedPlayerId);
    }
  }, [user, selectedPlayerId]);

  useEffect(() => {
    if (selectedCategory === 'recommended') return;

    if (searchQuery === prevSearchQueryRef.current && prevSearchQueryRef.current !== '') {
      fetchDrills();
    } else if (searchQuery) {
      if (fetchDrillsTimeout.current) {
        clearTimeout(fetchDrillsTimeout.current);
      }

      fetchDrillsTimeout.current = setTimeout(() => {
        fetchDrills();
      }, 1000);
    } else {
      fetchDrills();
    }

    prevSearchQueryRef.current = searchQuery;

    return () => {
      if (fetchDrillsTimeout.current) {
        clearTimeout(fetchDrillsTimeout.current);
      }
    };
  }, [currentPage, selectedCategory, searchQuery]);

  useEffect(() => {
    if (searchQuery) {
      setSelectedCategory('all');
      setCurrentPage(1);
    }
  }, [searchQuery]);

  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue);
    setCurrentPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    const container = document.querySelector(".videos-container");
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const filteredVideos = selectedCategory === 'recommended' ? recommendedVideos : videos;

  const handleOpenPayModal = () => {
    setIsModalOpen(true);
  };

  const renderRecommendedVideos = () => {
    if (selectedCategory !== 'recommended') return null;

    if (recommendedVideos.length === 0) {
      return (
        <div className="flex justify-center items-center w-full pt-24">
          <p className="text-white">No videos available</p>
        </div>
      );
    }

    return (
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {populatedRecommendedSections.filter(section => section.videos.length > 0).map((section, index) => (
          <React.Fragment key={section._id}>
            <Grid item xs={12} display={section._id === 'uncategorized' ? 'none' : 'block'} sx={{ mt: index === 0 ? 2 : -2 }}>
              <Typography
                color="primary"
                fontWeight="bold"
                fontSize={{ xs: 20, sm: 22, md: 24 }}
              >
                {section.name}
              </Typography>
            </Grid>
            <Grid item container spacing={{ xs: 2, sm: 3, md: 4 }}>
              {section.videos.map((video, index) => (
                <Grid item xs={12} sm={12} md={6} lg={6} xl={4} key={index}>
                  <p>{video.sections?.map(section => section.name).join(', ')}</p>
                  <VideoCard
                    video={video}
                    videos={section.videos}
                    setSelectedVideoId={setSelectedVideoId}
                    setSelectedVideoData={setSelectedVideoData}
                    setShowEditModal={setShowEditModal}
                    setShowDeleteModal={setShowDeleteModal}
                    setIsModalOpen={setIsModalOpen}
                    handleOpenPayModal={handleOpenPayModal}
                  />
                </Grid>
              ))}
            </Grid>
            <Grid item xs={12} display={section._id === 'uncategorized' ? 'none' : 'block'}>
              <Divider sx={{ bgcolor: 'rgba(137, 147, 158, 1)' }} />
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
    );
  };

  return (
    <>
      {showRecommendedSection && runTour && (
        <Joyride
          steps={tour}
          run={true}
          continuous={true}
          showProgress={true}
          showSkipButton={true}
          locale={{
            last: 'Finish'
          }}
          styles={{
            options: {
              arrowColor: '#111827',
              backgroundColor: '#111827',
              textColor: 'white',
              width: 100,
            },
            tooltip: { width: "250px" },
            buttonNext: {
              backgroundColor: "#32E100",
              color: "black",
              border: "none",
              borderRadius: "10px"
            },
            buttonBack: {
              // backgroundColor: "#32E100",
              color: "white",
              border: "none",
              borderRadius: "10px"
            },
          }}
        />
      )}
      <div className="flex-1 videos-container overflow-x-hidden">
        <div className="blueBackground p-3 md:p-4 primary-border rounded-lg flex items-center justify-between mb-4 min-h-[6rem] md:min-h-[8rem] w-full xl:w-3/5">
          <div className="flex gap-2 md:gap-5 items-center">
            <div className="ml-2 md:ml-4">
              <h2 className="text-lg md:text-2xl lg:text-4xl font-normal">
                Here's your
                <span className="ml-2 text-primary font-semibold">
                  Drill Library
                </span>
              </h2>
              <p className="text-white text-xs md:text-sm mt-1">
                Please choose any category below to see the desired media.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg px-2 md:px-4">
          <div className="flex flex-wrap  items-start md:items-center justify-between gap-4 w-full">
            <Tabs
              value={selectedCategory}
              onChange={handleCategoryChange}
              indicatorColor="none"
              textColor="inherit"
              variant="scrollable"
              scrollButtons="auto"
              aria-label="category tabs"
              className=" !blueBackground py-2 md:py-2.5 !px-2 md:!px-2.5 rounded-lg min-h-[48px] md:min-h-[56px]"
              sx={{
                color: "white",
                ".MuiButtonBase-root.MuiTab-root": {
                  minHeight: { xs: "36px", md: "40px" },
                  backgroundColor: "#32E10026",
                  borderRadius: "6px",
                  fontWeight: 500,
                  fontSize: { xs: "13px", sm: "14px", md: "15px" },
                  textTransform: "capitalize",
                  padding: { xs: "8px 12px", md: "10px 16px" },
                  minWidth: { xs: "auto", md: "90px" },
                },
                ".MuiTabs-flexContainer": {
                  gap: { xs: "8px", md: "12px" },
                },
                ".MuiButtonBase-root.MuiTab-root.Mui-selected": {
                  color: "#090F21",
                  backgroundColor: "#32E100",
                },
                ".MuiTabs-scrollButtons": {
                  width: { xs: 28, md: 36 },
                },
              }}
            >
              {[
                { name: 'All', _id: 'all' },
                ['player', 'trainer'].includes(user?.role) && { name: 'Recommended', _id: 'recommended' }
              ].filter(Boolean).concat(categories).map((category) => (
                  <Tab
                  className={category._id === 'recommended' ? 'recommended-videos-tab' : ''}
                    key={category._id}
                    label={category.name}
                    value={category._id}
                    sx={{
                      color: "#ffffff",
                      "&.Mui-selected": {
                        color: "#000000",
                      },
                    }}
                  />
                ))}
            </Tabs>

            <div className="flex flex-col lg:flex-nowrap md:flex-wrap md:flex-row  w-full md:w-fit items-center justify-end gap-3 md:gap-4">
              <div className="flex search-bar w-full  ">
                <input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full py-2 px-3 min-w-[400px] rounded-lg text-white h-10 md:h-12 search-background focus:outline-none focus:ring-1 focus:ring-green-500 text-sm md:text-base"
                />
              </div>
              {user?.role === "admin" && (
                <button
                  className="bg-white dark-blue-color min-w-[100px] rounded w-full  px-4 h-10 md:h-12 flex items-center justify-center text-sm md:text-base font-medium hover:bg-gray-100 transition-colors"
                  onClick={() => setShowAddModal(true)}
                >
                  ADD NEW DRILL
                </button>
              )}
            </div>
          </div>
          {selectedCategory === 'recommended' && user?.role === 'trainer' && trainerPlayers && trainerPlayers.length > 0 && (
            <div className="flex items-center gap-4 mt-6">
              <div className="pl-3 text-xl font-semibold">
                  <p>Viewing recommended videos for: </p>
                </div>
                <div className="w-full md:w-[250px]">
                  <TextField
                    variant="outlined"
                    select
                    size="small"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full text-primary blueBackground rounded-lg text-white focus:outline-none placeholder:opacity-45 primary-border focus:border-green-500"
                  >
                    {trainerPlayers.map((player) => (
                      <MenuItem
                        key={player._id}
                        className="bg-slate-700"
                        value={player._id}
                        style={{ color: "#FFF" }}
                      >
                        {player.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
              <div style={{ display: fetchingRecommendedVideos ? 'block' : 'none' }}>
                  <CircularProgress size={20} />
                </div>
              </div>
            )}

          {showRecommendedSection && (
            <Grid
              container
              gap={2}
              sx={{
                marginTop: { xs: 2, md: 3 },
                overflow: "auto",
                flexDirection: "column",
              }}
            >
              <Grid
                item
                container
                justifyContent={"space-between"}
                alignItems="center"
                paddingX={1.5}
              >
                <Grid item className="recommended-videos-section">
                  <Typography
                    color={"primary"}
                    fontWeight={"bold"}
                    fontSize={{ xs: 20, sm: 22, md: 24 }}
                  >
                    Recommended
                  </Typography>
                </Grid>
                <Grid
                  item
                  onClick={() => setSelectedCategory("recommended")}
                  sx={{ cursor: "pointer" }}
                >
                  <Typography
                    fontWeight={"bold"}
                    fontSize={{ xs: 14, sm: 16, md: 18 }}
                    sx={{
                      color: "rgba(137, 147, 158, 1)",
                      textDecoration: "underline",
                      "&:hover": {
                        color: "rgba(137, 147, 158, 0.8)",
                      },
                    }}
                  >
                    View All
                  </Typography>
                </Grid>
              </Grid>

              <Grid item container spacing={{ xs: 2, sm: 3, md: 4 }}>
                {recommendedVideosRandomized.map((video, index) => (
                  <Grid item xs={12} sm={12} md={6} lg={6} xl={4} key={index}>
                    <Card
                      sx={{
                        borderRadius: "10px",
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      className="relative group"
                    >
                      <div
                        className="relative w-full"
                        style={{ paddingTop: "56.25%" }}
                      >
                        <CardMedia
                          component={video.videoLink ? "iframe" : "img"}
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "10px",
                          }}
                          src={
                            video.videoLink
                              ? video.videoLink.match("vimeo")
                                ? convertVimeoUrlToEmbed(video.videoLink)
                                : video.videoLink
                              : video.thumbnailUrl
                          }
                          title={video.title}
                          allowFullScreen
                          style={{
                            filter: !video.videoLink ? "blur(5px)" : "none",
                          }}
                        />
                        {!video.videoLink && (
                          <div
                            className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-lg bg-black/50 transition-opacity group-hover:bg-black/60"
                            onClick={handleOpenPayModal}
                          >
                            <img
                              src="/assets/lock-icon.png"
                              alt="Locked"
                              className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-110"
                            />
                          </div>
                        )}
                      </div>

                      <CardContent className="!p-3 !pb-2 mt-2 flex-grow">
                        <Grid
                          container
                          gap={1}
                          justifyContent={"space-between"}
                          height="100%"
                        >
                          <Grid
                            item
                            container
                            flexDirection={"column"}
                            xs={true}
                            spacing={1}
                          >
                            <Grid
                              item
                              container
                              justifyContent={"space-between"}
                              alignItems="flex-start"
                              wrap="nowrap"
                            >
                              <Grid
                                item
                                sx={{ flex: 1, pr: video.metCriteria ? 1 : 0 }}
                              >
                                <p className="text-sm md:text-base font-semibold text-white line-clamp-2">
                                  {video.title}
                                </p>
                              </Grid>
                              {video.metCriteria && (
                                <Grid item>
                                  <Tooltip
                                    title={
                                      <div style={{ whiteSpace: "pre-line" }}>
                                        {video.metCriteria
                                          .map(
                                            (c) =>
                                              `${
                                                user?.role === "player"
                                                  ? "Your"
                                                  : "Player's"
                                              } ${c.description}`
                                          )
                                          .join("\n")}
                                      </div>
                                    }
                                    placement="bottom"
                                    arrow
                                  >
                                    <Info
                                      sx={{
                                        color: "gray",
                                        fontSize: {
                                          xs: "1.1rem",
                                          sm: "1.2rem",
                                        },
                                        mt: "2px",
                                        cursor: "help",
                                        transition: "color 0.2s",
                                        "&:hover": {
                                          color: "lightgray",
                                        },
                                      }}
                                    />
                                  </Tooltip>
                                </Grid>
                              )}
                            </Grid>
                            <Grid item>
                              <p className="text-xs md:text-sm text-gray-300 line-clamp-2">
                                {video.description}
                              </p>
                            </Grid>
                          </Grid>
                          {user?.role === "admin" && (
                            <Grid
                              item
                              container
                              gap={1}
                              xs={"auto"}
                              alignItems="flex-start"
                            >
                              <Grid item>
                                <button
                                  onClick={() => handleEditClick(video._id)}
                                  className="bg-white flex justify-center items-center w-7 h-7 text-green-600 rounded p-1.5 focus:outline-none hover:bg-gray-100 transition-colors"
                                >
                                  <img
                                    src="/assets/edit-icon.svg"
                                    alt="Edit"
                                    className="w-4 h-4"
                                  />
                                </button>
                              </Grid>
                              <Grid item>
                                <button
                                  onClick={() => handleDeleteClick(video._id)}
                                  className="button-danger flex justify-center items-center w-7 h-7 rounded p-1.5 focus:outline-none hover:opacity-90 transition-opacity"
                                >
                                  <img
                                    src="/assets/delete-icon-white.svg"
                                    alt="Delete"
                                    className="w-4 h-4"
                                  />
                                </button>
                              </Grid>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Grid item paddingX={1.5} marginTop={2}>
                <Divider sx={{ bgcolor: 'rgba(137, 147, 158, 1)' }} />
              </Grid>
            </Grid>
          )}

          {loading ? (
            <div className="flex justify-center items-center mt-8 md:mt-12">
              <CircularProgress />
            </div>
          ) : (
            <>
              {selectedCategory === 'recommended' ? (
                renderRecommendedVideos()
              ) : (
                <Grid
                  container
                  spacing={{ xs: 2, sm: 3, md: 4 }}
                  sx={{ marginTop: { xs: 2, md: 3 } }}
                >
                  {filteredVideos.length > 0 ? (
                    filteredVideos.map((video, index) => (
                      <Grid item xs={12} sm={12} md={6} lg={6} xl={4} key={index}>
                        <VideoCard
                          video={video}
                          videos={filteredVideos}
                          setSelectedVideoId={setSelectedVideoId}
                          setSelectedVideoData={setSelectedVideoData}
                          setShowEditModal={setShowEditModal}
                          setShowDeleteModal={setShowDeleteModal}
                          setIsModalOpen={setIsModalOpen}
                          handleOpenPayModal={handleOpenPayModal}
                        />
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <div className="flex justify-center items-center w-full py-12 md:py-24">
                        <p className="text-white text-sm md:text-base">
                          No videos available
                        </p>
                      </div>
                    </Grid>
                  )}
                </Grid>
              )}
            </>
          )}

          <div
            className={`mt-6 md:mt-8 mb-6 md:mb-8 ${
              selectedCategory === "recommended" ? "hidden" : ""
            }`}
          >
            <Pagination
              page={currentPage}
              count={totalPages}
              onChange={handlePageChange}
              size={window.innerWidth < 768 ? "small" : "medium"}
            />
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddVideoModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          categories={categories}
          initialCategory={
            ["all", "recommended"].includes(selectedCategory)
              ? undefined
              : selectedCategory
          }
          onSuccess={fetchDrills}
          recommendationsCriteria={recommendationsCriteria}
        />
      )}
      {showEditModal && (
        <EditVideoModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          videoId={selectedVideoId}
          videoData={selectedVideoData}
          categories={categories}
          onSuccess={fetchDrills}
          recommendationsCriteria={recommendationsCriteria}
        />
      )}
      {showDeleteModal && (
        <DeleteDrillModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          videoId={selectedVideoId}
          onSuccess={fetchDrills}
        />
      )}
      <PayToWatchDialog
        open={isModalOpen}
        onClose={handleCloseModal} />
    </>
  );
};

export default DrillLibrary;

