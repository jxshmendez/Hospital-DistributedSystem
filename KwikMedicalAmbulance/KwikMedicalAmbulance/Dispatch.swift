struct Dispatch: Identifiable, Decodable {
    let id: Int
    let patientId: String
    let patientName: String
    let patientAddress: String
    let condition: String
    let timestamp: String
    let medicalHistory: String
    let completed: Int
    let patientLatitude: Double?
    let patientLongitude: Double?
    let ambulanceId: String?  // Optional, can be nil
    let completionTime: String?  // Optional, can be nil

    enum CodingKeys: String, CodingKey {
        case id
        case patientId
        case patientName
        case patientAddress
        case condition
        case timestamp
        case medicalHistory
        case completed
        case patientLatitude
        case patientLongitude
        case ambulanceId
        case completionTime
    }

    // Custom initializer to handle default values
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        patientId = try container.decodeIfPresent(String.self, forKey: .patientId) ?? ""
        patientName = try container.decodeIfPresent(String.self, forKey: .patientName) ?? "Unknown"
        patientAddress = try container.decodeIfPresent(String.self, forKey: .patientAddress) ?? "Unknown"
        condition = try container.decodeIfPresent(String.self, forKey: .condition) ?? "Unknown"
        timestamp = try container.decodeIfPresent(String.self, forKey: .timestamp) ?? "Unknown"
        medicalHistory = try container.decodeIfPresent(String.self, forKey: .medicalHistory) ?? "Not provided"
        completed = try container.decodeIfPresent(Int.self, forKey: .completed) ?? 0
        patientLatitude = try container.decodeIfPresent(Double.self, forKey: .patientLatitude)
        patientLongitude = try container.decodeIfPresent(Double.self, forKey: .patientLongitude)
        ambulanceId = try container.decodeIfPresent(String.self, forKey: .ambulanceId)  // Optional, nil if not present
        completionTime = try container.decodeIfPresent(String.self, forKey: .completionTime)  // Optional, nil if not present
    }
}
