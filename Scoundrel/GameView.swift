import SwiftUI
import UIKit
import WebKit

/// Hosts the bundled HTML/JS game (Scoundrel.app/Web) in a full-screen WKWebView.
/// Files are served through a custom URL scheme so everything works offline
/// with a stable origin, and the page gets two native bridges:
///   window.webkit.messageHandlers.haptic  -> Taptic Engine feedback
///   window.webkit.messageHandlers.store   -> save game to UserDefaults
struct GameView: UIViewRepresentable {
    static let scheme = "scoundrel"
    static let saveKey = "scoundrel.save"

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(LocalFileSchemeHandler(), forURLScheme: GameView.scheme)
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let content = WKUserContentController()
        content.add(context.coordinator, name: "haptic")
        content.add(context.coordinator, name: "store")
        if let script = Coordinator.restoreScript() {
            content.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        config.userContentController = content

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsLinkPreview = false
        webView.allowsBackForwardNavigationGestures = false
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        #endif

        if let url = URL(string: "\(GameView.scheme)://app/index.html") {
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler {
        private let selection = UISelectionFeedbackGenerator()
        private let notification = UINotificationFeedbackGenerator()

        static func restoreScript() -> String? {
            guard let saved = UserDefaults.standard.string(forKey: GameView.saveKey),
                  let data = try? JSONSerialization.data(withJSONObject: [saved]),
                  let literal = String(data: data, encoding: .utf8) else { return nil }
            return "window.__NATIVE_SAVE__ = (\(literal))[0];"
        }

        func userContentController(_ userContentController: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            switch message.name {
            case "store":
                if let json = message.body as? String {
                    UserDefaults.standard.set(json, forKey: GameView.saveKey)
                }
            case "haptic":
                guard let body = message.body as? [String: Any],
                      let kind = body["kind"] as? String else { return }
                let amount = (body["amount"] as? NSNumber)?.doubleValue ?? 0
                play(kind: kind, amount: amount)
            default:
                break
            }
        }

        private func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle, _ intensity: Double) {
            let gen = UIImpactFeedbackGenerator(style: style)
            gen.prepare()
            gen.impactOccurred(intensity: CGFloat(max(0.2, min(1.0, intensity))))
        }

        private func play(kind: String, amount: Double) {
            switch kind {
            case "tap":
                selection.selectionChanged()
            case "hit":
                // stronger thump for bigger hits (monsters go up to 14)
                impact(.heavy, 0.45 + amount / 14.0 * 0.55)
                if amount >= 8 {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.09) { [weak self] in
                        self?.impact(.heavy, 1.0)
                    }
                }
            case "kill":
                impact(.rigid, 0.9)
            case "equip":
                impact(.rigid, 0.6)
            case "heal":
                impact(.soft, 0.7)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { [weak self] in
                    self?.impact(.soft, 0.5)
                }
            case "flee":
                impact(.medium, 0.7)
            case "warning":
                notification.notificationOccurred(.warning)
            case "death":
                notification.notificationOccurred(.error)
            case "win":
                notification.notificationOccurred(.success)
            default:
                impact(.light, 0.6)
            }
        }
    }
}

/// Serves files from the app bundle's "Web" folder for scoundrel://app/<path>.
final class LocalFileSchemeHandler: NSObject, WKURLSchemeHandler {
    private let root: URL? = Bundle.main.resourceURL?.appendingPathComponent("Web", isDirectory: true)

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url, let root = root else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        var path = url.path.removingPercentEncoding ?? url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let fileURL = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL

        // never serve anything outside the Web folder
        guard fileURL.path.hasPrefix(root.standardizedFileURL.path),
              let data = try? Data(contentsOf: fileURL) else {
            let response = HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!
            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(Data())
            urlSchemeTask.didFinish()
            return
        }

        let headers = [
            "Content-Type": LocalFileSchemeHandler.mimeType(for: fileURL.pathExtension),
            "Content-Length": String(data.count),
            "Cache-Control": "no-cache"
        ]
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    static func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "ttf": return "font/ttf"
        case "otf": return "font/otf"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        case "mp3": return "audio/mpeg"
        case "wav": return "audio/wav"
        default: return "application/octet-stream"
        }
    }
}
