import { useCallback, useRef, useState } from 'react'

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.aiff', '.aif']

// Files coming from a folder (webkitdirectory or a dropped directory) often
// have an empty `type`, so we can't rely on MIME alone - fall back to the
// file extension.
function isAudioFile(file) {
  if (file.type && file.type.startsWith('audio/')) return true
  const name = file.name.toLowerCase()
  return AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext))
}

// Recursively walk a dropped directory tree via the webkitGetAsEntry API,
// collecting every file. Used so dropping a folder (not just files) works.
function readEntry(entry) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => resolve([file]), () => resolve([]))
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const collected = []
      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            const nested = await Promise.all(collected.map(readEntry))
            resolve(nested.flat())
            return
          }
          collected.push(...entries)
          // readEntries returns at most ~100 entries per call; keep going.
          readBatch()
        }, () => resolve([]))
      }
      readBatch()
    } else {
      resolve([])
    }
  })
}

function DropZone({ onFiles }) {
  const [isDragging, setIsDragging] = useState(false)
  const folderInputRef = useRef(null)

  const handleDrop = useCallback(
    async (event) => {
      event.preventDefault()
      setIsDragging(false)

      const items = Array.from(event.dataTransfer.items || [])
      const entries = items
        .map((item) => (item.webkitGetAsEntry ? item.webkitGetAsEntry() : null))
        .filter(Boolean)

      let files
      if (entries.length) {
        const nested = await Promise.all(entries.map(readEntry))
        files = nested.flat()
      } else {
        files = Array.from(event.dataTransfer.files)
      }

      const audioFiles = files.filter(isAudioFile)
      if (audioFiles.length) onFiles(audioFiles)
    },
    [onFiles]
  )

  const handleSelect = useCallback(
    (event) => {
      const files = Array.from(event.target.files).filter(isAudioFile)
      if (files.length) onFiles(files)
      event.target.value = ''
    },
    [onFiles]
  )

  return (
    <div
      className={`drop-zone${isDragging ? ' dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <p>Drag &amp; drop audio files or a folder here, or</p>
      <div className="drop-zone-buttons">
        <label className="file-input-label">
          Browse files
          <input type="file" accept="audio/*" multiple onChange={handleSelect} hidden />
        </label>
        <label className="file-input-label">
          Browse folder
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleSelect}
            hidden
          />
        </label>
      </div>
    </div>
  )
}

export default DropZone
