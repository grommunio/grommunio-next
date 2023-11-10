// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { useState } from 'react';
import { useDispatch } from 'react-redux';

export default function useInfiniteScroll(data, count, fetchData) {
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleScroll = () => {
    if (data.length >= count) return;
    if (
      Math.floor(
        document.getElementById("scrollDiv")?.scrollHeight -
          document.getElementById("scrollDiv")?.scrollTop
      ) <=
      document.getElementById("scrollDiv")?.offsetHeight + 20
    ) {
      if (!loading) { 
        setLoading(true);
        setOffset(offset + 10 /* TODO: This needs to become a variable asap */);
        dispatch(fetchData({
          skip: offset + 10
        }))
          .then(() => setLoading(false))
          .catch(() => setLoading(false));
      }
    }
  };

  const handleScrollReset = () => setOffset(0);
  
  return [handleScroll, handleScrollReset];
}
