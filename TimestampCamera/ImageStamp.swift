import UIKit

enum StampPosition { case topLeft, topRight, bottomLeft, bottomRight }

enum ImageStamp {
    static func render(image: UIImage, text: String, position: StampPosition) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = image.scale
        format.opaque = true

        let renderer = UIGraphicsImageRenderer(size: image.size, format: format)

        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: image.size))

            let fontSize = max(22, image.size.width * 0.028)
            let font = UIFont.monospacedSystemFont(ofSize: fontSize, weight: .semibold)

            let attributes: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: UIColor.white,
                .strokeColor: UIColor.black,
                .strokeWidth: -2.0
            ]

            let textSize = (text as NSString).size(withAttributes: attributes)
            let margin = max(18, image.size.width * 0.025)

            let x: CGFloat
            let y: CGFloat

            switch position {
            case .topLeft:
                x = margin; y = margin
            case .topRight:
                x = image.size.width - textSize.width - margin; y = margin
            case .bottomLeft:
                x = margin; y = image.size.height - textSize.height - margin
            case .bottomRight:
                x = image.size.width - textSize.width - margin
                y = image.size.height - textSize.height - margin
            }

            (text as NSString).draw(
                in: CGRect(x: x, y: y, width: textSize.width, height: textSize.height),
                withAttributes: attributes
            )
        }
    }
}
