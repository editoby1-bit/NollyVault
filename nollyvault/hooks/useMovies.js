import { useState, useEffect } from 'react'
import { useSupabaseClient } from '../pages/_app'

const MOCK_MOVIES = [
  { id: '1', title: 'Living in Bondage', year: 1992, category: 'Classic Horror & Occult', producer: 'NEK Video Links', actors: ['Kenneth Okonkwo', 'Bob Manuel Udokwu'], duration: '1h 45m', rating: 9.2, description: "The story of Andy Okeke who sacrifices his wife to a secret cult for wealth, only to be haunted by her spirit.", thumbnail_url: null, is_featured: true, trending: true, rewatched: true },
  { id: '2', title: 'Karishika', year: 1996, category: 'Classic Horror & Occult', producer: 'Vic. O Productions', actors: ['Chika Okpala', 'Ndidi Obi'], duration: '2h 10m', rating: 8.8, description: 'A demon queen sent from hell to collect souls, Karishika targets sinners and the morally weak.', thumbnail_url: null, trending: true, rewatched: true },
  { id: '3', title: 'Nneka the Pretty Serpent', year: 1992, category: 'Classic Horror & Occult', producer: 'Anambra Films', actors: ['Joke Silva', 'Ego Boyo'], duration: '1h 55m', rating: 8.9, description: 'A beautiful woman harbors a deadly serpentine secret that destroys the men in her life.', thumbnail_url: null, rewatched: true },
  { id: '4', title: 'Glamour Girls', year: 1994, category: 'Village Drama', producer: 'Zeb Ejiro Productions', actors: ['Eucharia Anunobi', 'Sandra Achums'], duration: '2h 0m', rating: 8.5, description: 'A tale of beautiful women, money, and the dark world of Lagos.', thumbnail_url: null, trending: true },
  { id: '5', title: 'Blood Money', year: 1996, category: 'Classic Horror & Occult', producer: 'Afri Projects', actors: ['Kanayo O. Kanayo', 'Pete Edochie'], duration: '1h 50m', rating: 8.7, description: 'The consequences of ritual money-making destroy a family from within.', thumbnail_url: null },
  { id: '6', title: 'End of the Wicked', year: 1999, category: 'Classic Horror & Occult', producer: 'Helen Ukpabio', actors: ['Toun Oni', 'Gentle Jack'], duration: '2h 5m', rating: 8.3, description: 'A chilling exploration of witchcraft and its devastating impact on families.', thumbnail_url: null },
  { id: '7', title: 'Domitilla', year: 1996, category: 'Village Drama', producer: 'Zeb Ejiro Productions', actors: ['Kate Henshaw', 'Monalisa Chinda'], duration: '1h 40m', rating: 8.4, description: 'A young woman is forced into prostitution to survive the harsh streets of Lagos.', thumbnail_url: null },
  { id: '8', title: 'Rattlesnake', year: 1995, category: 'Crime & Thriller', producer: 'Amaka Igwe Films', actors: ['Pat Attah', 'Amaka Igwe'], duration: '1h 48m', rating: 8.6, description: 'A daring robber with a code of honour navigates crime and redemption.', thumbnail_url: null, trending: true },
  { id: '9', title: 'Issakaba', year: 2000, category: 'Crime & Thriller', producer: 'Lancelot Imasuen', actors: ['Sam Dede', 'Hanks Anuku'], duration: '2h 15m', rating: 8.9, description: 'Vigilante justice in the Niger Delta.', thumbnail_url: null, trending: true, rewatched: true },
  { id: '10', title: 'Egg of Life', year: 2003, category: 'Family Favorites', producer: 'Tchidi Chikere', actors: ['Genevieve Nnaji', 'Ramsey Nouah'], duration: '1h 52m', rating: 8.7, description: "A couple's journey through infertility.", thumbnail_url: null },
  { id: '11', title: 'Most Wanted', year: 1997, category: 'Crime & Thriller', producer: 'Andy Amenechi', actors: ['Tony Umez', 'Ngozi Ezeonu'], duration: '1h 55m', rating: 8.2, description: "Nigeria's most wanted criminal goes on a legendary crime spree.", thumbnail_url: null },
  { id: '12', title: 'Tears in My Eyes', year: 2000, category: 'Family Favorites', producer: 'Emem Isong', actors: ['Liz Benson', 'Patience Ozokwor'], duration: '2h 0m', rating: 8.4, description: "A woman's love for her children is tested by a wicked stepmother.", thumbnail_url: null },
  { id: '13', title: 'Battle of Musanga', year: 1996, category: 'Village Drama', producer: 'Zeb Ejiro', actors: ['Pete Edochie', 'Ngozi Ezeonu'], duration: '1h 58m', rating: 8.1, description: 'A village is torn apart by conflict over land and power.', thumbnail_url: null },
  { id: '14', title: 'Ritual', year: 1997, category: 'Classic Horror & Occult', producer: 'Chris Obi Rapu', actors: ['Kanayo O. Kanayo'], duration: '1h 50m', rating: 8.0, description: 'Dark secrets within a wealthy household lead to horrifying consequences.', thumbnail_url: null },
  { id: '15', title: 'Power of Love', year: 2001, category: 'Family Favorites', producer: 'Emem Isong', actors: ['Genevieve Nnaji', 'Ramsey Nouah'], duration: '1h 45m', rating: 8.3, description: 'A love story that crosses family boundaries and social class.', thumbnail_url: null },
]

export function useMovies() {
  const supabase = useSupabaseClient()
  const [movies, setMovies] = useState(MOCK_MOVIES)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return
    async function load() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('*, movie_actors(actor_name)')
          .eq('is_active', true)
          .order('year', { ascending: false })
        if (!error && data && data.length > 0) setMovies(data)
      } catch (e) {
        console.warn('Using mock data:', e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  return { movies, loading }
}
