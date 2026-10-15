/** Big standalone search bar; submits to /plants?q=... */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from './ui';

export function BigSearch({ initial = '' }: { initial?: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initial);
  return (
    <div className="searchbar-panel">
      <form
        className="searchbar"
        role="search"
        aria-label="Search the encyclopedia"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/plants?q=${encodeURIComponent(value.trim())}`);
        }}
      >
        <label className="sr-only" htmlFor="big-search">
          Search a plant, traditional remedy, health topic, or scientific question
        </label>
        <Input
          id="big-search"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a plant, traditional remedy, health topic, or scientific question…"
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>
    </div>
  );
}
