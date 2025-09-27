import { m } from "framer-motion";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { DetailPageLoader, Error, Poster, Section } from "@/common";
import { Genre } from "./components";

import { useMotion } from "@/hooks/useMotion";
import { useGetTrackQuery } from "@/services/MusicAPI";
import { mainHeading, maxWidth, paragraph } from "@/styles";
import { cn, getImageUrl } from "@/utils/helper";

interface DetailProps {
  audioPlayer?: any;
}

const Detail = ({ audioPlayer: _audioPlayer }: DetailProps) => {
  const { category, id } = useParams();
  const [show, setShow] = useState<Boolean>(false);
  const { fadeDown, staggerContainer } = useMotion();

  const {
    data: track,
    isLoading,
    isFetching,
    isError,
  } = useGetTrackQuery({
    category: String(category || ''),
    id: id || '',
  }, {
    skip: !category || !id
  });

  useEffect(() => {
    document.title =
      (track?.title || track?.name) && !isLoading
        ? track.title || track.name
        : "Podbeat";

    return () => {
      document.title = "Podbeat";
    };
  }, [track?.title, isLoading, track?.name]);

  // Handle missing URL parameters after hooks
  if (!category || !id) {
    return <Error error="Invalid URL. Please check the link and try again." />;
  }

  const toggleShow = () => setShow((prev) => !prev);

  if (isLoading || isFetching) {
    return <DetailPageLoader />;
  }

  if (isError) {
    return <Error error="Unable to load content. Please try again later." />;
  }

  const {
    title,
    poster_path: posterPath,
    overview,
    name,
    genres,
  } = track || {};

  const backgroundStyle = {
    backgroundImage: `linear-gradient(to top, rgba(0,0,0), rgba(0,0,0,0.98),rgba(0,0,0,0.8) ,rgba(0,0,0,0.4)),url('${getImageUrl(posterPath || '')}'`,
    backgroundPosition: "top",
    backgroundSize: "cover",
  };

  return (
    <>
      <section className="w-full" style={backgroundStyle}>
        <div
          className={`${maxWidth} lg:py-36 sm:py-[136px] sm:pb-28 xs:py-28 xs:pb-12 pt-24 pb-8 flex flex-row lg:gap-12 md:gap-10 gap-8 justify-center`}
        >
          <Poster title={title || name || ''} posterPath={posterPath || ''} />
          <m.div
            variants={staggerContainer(0.2, 0.4)}
            initial="hidden"
            animate="show"
            className="text-gray-300 sm:max-w-[80vw] max-w-[90vw]  md:max-w-[520px] font-nunito flex flex-col lg:gap-5 sm:gap-4 xs:gap-[14px] gap-3 mb-8 flex-1 will-change-transform motion-reduce:transform-none"
          >
            <m.h2
              variants={fadeDown}
              className={cn(mainHeading, " md:max-w-[420px] will-change-transform motion-reduce:transform-none")}
            >
              {title || name}
            </m.h2>

            <m.ul
              variants={fadeDown}
              className="flex flex-row items-center  sm:gap-[14px] xs:gap-3 gap-[6px] flex-wrap will-change-transform motion-reduce:transform-none"
            >
              {(genres || []).map((genre: { name: string; id: number }) => {
                return <Genre key={genre.id} name={genre.name} />;
              })}
            </m.ul>

            <m.p variants={fadeDown} className={`${paragraph} will-change-transform motion-reduce:transform-none`}>
              <span>
                {(overview || '').length > 280
                  ? `${show ? overview : `${(overview || '').slice(0, 280)}...`}`
                  : overview}
              </span>
              <button
                type="button"
                className={cn(
                  `font-bold ml-1 hover:underline transition-all duration-300`,
                  (overview || '').length > 280 ? "inline-block" : "hidden"
                )}
                onClick={toggleShow}
              >
                {!show ? "show more" : "show less"}
              </button>
            </m.p>

          </m.div>
        </div>
      </section>


      <Section
        title={`Similar ${category === "tracks" ? "tracks" : category === "albums" ? "albums" : "music"}`}
        category={String(category)}
        className={`${maxWidth}`}
        id={Number(id)}
        showSimilarTracks
      />
    </>
  );
};

export default Detail;
