// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2020-2023 grommunio GmbH

import { useState } from 'react';

export default function usePinnedMessages() {
  const [value, setValue] = useState(JSON.parse(localStorage.getItem("pinnedMsgs") || "[]"));

  function updatePinnedMessages(newValue) {
    localStorage.setItem("pinnedMsgs", JSON.stringify(newValue));
    setValue(newValue);
  }
  
  return [value, updatePinnedMessages];
}
