import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationView {
            DispatchListView() // Reference the DispatchListView
                .navigationTitle("KwikMedical Ambulance")
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(LocationManager()) // Mocked environment if required
    }
}
