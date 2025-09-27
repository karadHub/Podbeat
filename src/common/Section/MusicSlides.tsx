import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import { TrackCard } from "@/components/ui/TrackCard";
import { ITrack } from "@/types";

interface MusicSlidesProps {
  tracks: ITrack[];
  category: string;
  useModernCards?: boolean;
  audioPlayer?: any;
}

const MusicSlides: FC<MusicSlidesProps> = ({ tracks, category, useModernCards: _useModernCards = true, audioPlayer }) => {
  const handlePlay = (track: ITrack) => {
    if (audioPlayer?.playTrack) {
      audioPlayer.playTrack(track);
    } else {
      console.log('🎵 Track clicked:', track.name || track.title);
    }
  };


  return (
    <Swiper slidesPerView="auto" spaceBetween={15} className="mySwiper">
      {tracks.map((track) => {
        return (
          <SwiperSlide
            key={track.id}
            className="flex mt-1 flex-col xs:gap-[14px] gap-2 max-w-[170px] rounded-lg"
          >
            <TrackCard
              track={track}
              category={category}
              isPlaying={false}
              onPlay={handlePlay}
              variant="detailed"
            />
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
};

export default MusicSlides;
