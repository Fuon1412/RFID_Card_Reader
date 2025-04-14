using MQTTnet;
using MQTTnet.Client;
using System.Text;
using System.Text.Json;

// Chỉ copy từ class RfidTag đến hết class Program
// Đảm bảo đã cài đặt các gói NuGet cần thiết:
// - MQTTnet

class Program
{
    // Tạo class để mapping với cấu trúc JSON trong file test_data.json
    class RfidTag
    {
        public string Type { get; set; }
        public string EPC { get; set; }
        public string TID { get; set; }
        public string UserData { get; set; }
        public string ReservedData { get; set; }
        public int Totalcount { get; set; }
        public double RSSI_db { get; set; }
    }

    static async Task Main() //Đổi tên thành ReadDataRFID
    {
        string brokerIp = "192.168.5.206"; // Thay bằng địa chỉ IP của Raspberry Pi
        string topic = "rfid/scan";
        string jsonFilePath = "test_data.json"; 
        
        try
        {
            string jsonContent = File.ReadAllText(jsonFilePath);
            Console.WriteLine($"Đã đọc file: {jsonFilePath}");
            
            var rfidTags = JsonSerializer.Deserialize<List<RfidTag>>(jsonContent); // thay jsonContent bằng dữ liệu thật đọc được từ thiết bịbị
            
            if (rfidTags == null || rfidTags.Count == 0)
            {
                Console.WriteLine("Không tìm thấy dữ liệu RFID trong file.");
                return;
            }
            
            Console.WriteLine($"Đã tìm thấy {rfidTags.Count} RFID tags trong file.");
            
            var factory = new MqttFactory();
            using var mqttClient = factory.CreateMqttClient();

            var options = new MqttClientOptionsBuilder()
                .WithTcpServer(brokerIp, 1883)
                .WithClientId("RfidPublisher")
                .Build();
            await mqttClient.ConnectAsync(options);
            Console.WriteLine("Đã kết nối đến MQTT broker.");
            
            foreach (var tag in rfidTags)
            {
                List<RfidTag> singleTagList = new List<RfidTag> { tag };
                string jsonMessage = JsonSerializer.Serialize(singleTagList);
                
                var msg = new MqttApplicationMessageBuilder()
                    .WithTopic(topic)
                    .WithPayload(Encoding.UTF8.GetBytes(jsonMessage))
                    .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce)
                    .Build();

                Console.WriteLine($"Đang gửi RFID: {tag.TID}, UserData: {tag.UserData}");
                await mqttClient.PublishAsync(msg);
                
                await Task.Delay(2000);
            }

            // Ngắt kết nối
            await mqttClient.DisconnectAsync();
            Console.WriteLine("Đã ngắt kết nối từ MQTT broker.");
        }
        catch (FileNotFoundException)
        {
            Console.WriteLine($"Không tìm thấy file: {jsonFilePath}");
        }
        catch (JsonException ex)
        {
            Console.WriteLine($"Lỗi khi phân tích JSON: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Đã xảy ra lỗi: {ex.Message}");
        }
        
        Console.WriteLine("Nhấn phím bất kỳ để thoát...");
        Console.ReadKey();
    }
}