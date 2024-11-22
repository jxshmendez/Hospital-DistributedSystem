import SwiftUI
import CoreLocation

// The DispatchListView manages the list of dispatches
struct DispatchListView: View {
    @State private var dispatches: [Dispatch] = []
    @State private var loading = true
    @State private var errorMessage: String?
   

    var body: some View {
        NavigationView {
            VStack {
                if loading {
                    ProgressView("Loading dispatches...")
                        .padding()
                } else if let errorMessage = errorMessage {
                    Text("Error: \(errorMessage)")
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding()
                } else if dispatches.isEmpty {
                    Text("No active dispatches at the moment.")
                        .font(.headline)
                        .foregroundColor(.gray)
                        .padding()
                } else {
                    List(dispatches) { dispatch in
                        DispatchRowView(dispatch: dispatch, onAccept: {
                            acceptDispatch(dispatchId: dispatch.id)
                        }, onComplete: {
                            completeDispatch(dispatchId: dispatch.id)
                        })
                    }
                }
            }
            .onAppear(perform: fetchDispatches)
            .navigationTitle("Active Dispatches")
        }
    }

    private func fetchDispatches() {
        guard let url = URL(string: "http://192.168.1.102:5001/api/dispatches") else {
            self.errorMessage = "Invalid URL. Please check the backend server address."
            self.loading = false
            return
        }

        URLSession.shared.dataTask(with: url) { data, response, error in
            DispatchQueue.main.async {
                self.loading = false
                if let error = error {
                    self.errorMessage = "Error: \(error.localizedDescription). Make sure both devices are on the same network."
                } else if let data = data {
                    do {
                        let fetchedDispatches = try JSONDecoder().decode([Dispatch].self, from: data)
                        self.dispatches = fetchedDispatches
                    } catch {
                        self.errorMessage = "Failed to decode response. Please check the server response format."
                    }
                }
            }
        }.resume()
    }

    private func acceptDispatch(dispatchId: Int) {
        guard let url = URL(string: "http://192.168.1.102:5001/api/dispatch/\(dispatchId)/accept") else {
            self.errorMessage = "Invalid URL for acceptDispatch."
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["ambulanceId": "1"]) // Example ambulance ID

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self.errorMessage = "Failed to accept dispatch: \(error.localizedDescription)"
                } else if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    self.fetchDispatches() // Refresh the list
                } else {
                    self.errorMessage = "Failed to accept dispatch. Please try again."
                }
            }
        }.resume()
    }

    private func completeDispatch(dispatchId: Int) {
        guard let url = URL(string: "http://192.168.1.102:5001/api/dispatch/\(dispatchId)/complete") else {
            self.errorMessage = "Invalid URL for completeDispatch."
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"

        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self.errorMessage = "Failed to complete dispatch: \(error.localizedDescription)"
                } else if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                    self.fetchDispatches() // Refresh the list
                } else {
                    self.errorMessage = "Failed to complete dispatch. Please try again."
                }
            }
        }.resume()
    }
}

// DispatchRowView: A view that represents a single row in the dispatch list
struct DispatchRowView: View {
    let dispatch: Dispatch
    let onAccept: () -> Void
    let onComplete: () -> Void

    var body: some View {
        VStack(alignment: .leading) {
            Text("Patient: \(dispatch.patientName)")
                .font(.headline)
            Text("Condition: \(dispatch.condition)")
                .font(.subheadline)
            
            if let ambulanceId = dispatch.ambulanceId {
                Text("Accepted by: Ambulance \(ambulanceId)")
                    .font(.footnote)
                    .foregroundColor(.blue)
                if dispatch.completed == 0 {
                    Button(action: onComplete) {
                        Text("Mark as Completed")
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                } else {
                    Text("Dispatch Completed")
                        .foregroundColor(.green)
                        .font(.footnote)
                }
            } else {
                Button(action: onAccept) {
                    Text("Accept Dispatch")
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
            }
        }
        .padding()
    }
}

struct DispatchListView_Previews: PreviewProvider {
    static var previews: some View {
        DispatchListView()
    }
}
