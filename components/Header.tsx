
import React from 'react';
import { GeminiIcon } from './icons/GeminiIcon';
import { TrelloIcon } from './icons/TrelloIcon';

const Header: React.FC = () => {
  return (
    <header className="text-center w-full max-w-3xl">
      <div className="flex justify-center items-center gap-4 mb-4">
        <GeminiIcon className="h-12 w-12" />
        <span className="text-4xl font-bold text-slate-400">+</span>
        <TrelloIcon className="h-10 w-10" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
        Meet Transcript to Trello
      </h1>
      <p className="mt-4 text-lg text-slate-400">
        Automatically extract action items from your Google Meet transcripts and create Trello cards in seconds.
      </p>
    </header>
  );
};

export default Header;
