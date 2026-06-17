import { useCallback, useState } from 'react'

function DropZone({ onFiles }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault()
      setIsDragging(false)
      const files = Array.from(event.dataTransfer.files).filter((f) =>
        f.type.startsWith('audio/')
      )
      if (files.length) onFiles(files)
    },
    [onFiles]
  )

  const handleSelect = useCallback(
    (event) => {
      const files = Array.from(event.target.files)
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
      <p>Drag & drop audio files here, or</p>
      <label className="file-input-label">
        Browse files
        <input type="file" accept="audio/*" multiple onChange={handleSelect} hidden />
      </label>
    </div>
  )
}

export default DropZone
