import { create } from 'zustand'

const useStore = create((set) => ({
  applications: [],
  isLoading: false,
  setApplications: (applications) => set({ applications }),
  setLoading: (isLoading) => set({ isLoading }),
  
  addApplication: (application) => 
    set((state) => ({ 
      applications: [...state.applications, application]
    })),
    
  updateApplication: (updatedApplication) =>
    set((state) => ({
      applications: state.applications.map(app => 
        app.id === updatedApplication.id ? updatedApplication : app
      )
    })),
}))

export default useStore