const express = require('express')
const crypto = require('node:crypto')
const cors = require('cors')
const movies = require('./movies.json')
const { validarMovie, validarPartialmovie } = require('./schemas/movies')

const app = express()
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://movies.com'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  }
}))
app.use(express.json())
app.disable('x-powered-by')

/* Metodos normales: GET/HEAD/POST
Metodo complejo: PUT/PATCH/DELETE

CORS Pre flight
OPTIONS */

app.get('/', (req, res) => {
  res.json({ message: 'hola mundo' })
})

// Todos los recursos movies se identifican /movies
app.get('/movies', (req, res) => {
  /* const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) { res.header('Access-Control-Allow-Origin', origin) }
  res.header('Access-Control-Allow-Origin', origin) */
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path to regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Pelicula no encontrada' })
})

app.post('/movies', (req, res) => {
  const result = validarMovie(req.body)

  if (result.error) {
    // 422 Unprocesable entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // base de datos
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }

  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  /* const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) { res.header('Access-Control-Allow-Origin', origin) } */

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Pelicula no encontrada' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Pelicula borrada' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validarPartialmovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie Not Found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})
/* const movie = movies[movieIndex]
   const { title, duration } = req.body

  if (title) movie.title = title
  if (duration) movie.duration = duration */

/* app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  }
  res.send(200)
}) */

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto http://localhost:${PORT}`)
})
